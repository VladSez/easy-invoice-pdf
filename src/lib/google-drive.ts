import { google } from "googleapis";
import { z } from "zod";
import { Readable } from "node:stream";

const googleDriveConfigSchema = z.object({
  clientEmail: z.string().email(),
  privateKey: z.string().min(1),
});

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

interface Success {
  status: "success";
  targetFolder: GoogleDriveFile;
  invoiceToUploadFolderPath: string;
}

interface Error {
  status: "error";
  notification: string;
}

type CreateOrFindInvoiceFolderResult = Success | Error;

const FolderInputSchema = z.object({
  parentFolderId: z.string().min(1),
  month: z.string().regex(/^\d{2}$/, "Month must be in MM format"),
  year: z.string().regex(/^\d{4}$/, "Year must be in YYYY format"),
});

type FolderInput = z.infer<typeof FolderInputSchema>;

export async function initializeGoogleDrive() {
  const config = googleDriveConfigSchema.parse({
    clientEmail: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  });

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

async function createFolder(
  drive: ReturnType<typeof google.drive>,
  folderName: string,
  parentFolderId?: string
): Promise<GoogleDriveFile> {
  const fileMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    ...(parentFolderId && { parents: [parentFolderId] }),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id, name, mimeType, webViewLink",
  });

  if (!response.data.id) {
    throw new Error("Failed to create folder");
  }

  return response.data as GoogleDriveFile;
}

function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  return stream;
}

export async function uploadFile({
  googleDrive,
  fileName,
  fileContent,
  folderId,
}: {
  googleDrive: ReturnType<typeof google.drive>;
  fileName: string;
  fileContent: Buffer;
  folderId: string;
}) {
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: "application/pdf",
    body: bufferToStream(fileContent),
  };

  const response = await googleDrive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, name, mimeType, webViewLink",
  });

  if (!response.data.id) {
    throw new Error("Failed to upload file");
  }

  return response.data as GoogleDriveFile;
}

export async function createOrFindInvoiceFolder({
  googleDrive,
  ...input
}: {
  googleDrive: ReturnType<typeof google.drive>;
} & FolderInput): Promise<CreateOrFindInvoiceFolderResult> {
  // Validate input
  const validatedInput = FolderInputSchema.parse(input);

  // First, try to find or create the year folder
  const yearFolderName = validatedInput.year;

  const yearFolderQuery =
    `name = '${yearFolderName}' and mimeType = 'application/vnd.google-apps.folder' and '${validatedInput.parentFolderId}' in parents and trashed = false` as const;

  const yearFolderResponse = await googleDrive.files.list({
    q: yearFolderQuery,
    fields: "files(id, name, mimeType, webViewLink)",
    spaces: "drive",
  });

  let yearFolder: GoogleDriveFile;

  if (yearFolderResponse.data.files?.length) {
    // if the year folder already exists, use it
    yearFolder = yearFolderResponse.data.files[0] as GoogleDriveFile;
  } else {
    // if the year folder does not exist, create it
    yearFolder = await createFolder(
      googleDrive,
      yearFolderName,
      validatedInput.parentFolderId
    );
  }

  // Then try to find or create the month folder inside the year folder
  const monthFolderName = `${validatedInput.month}.${validatedInput.year}`;

  const monthFolderQuery =
    `name = '${monthFolderName}' and mimeType = 'application/vnd.google-apps.folder' and '${yearFolder.id}' in parents and trashed = false` as const;

  const monthFolderResponse = await googleDrive.files.list({
    q: monthFolderQuery,
    fields: "files(id, name, mimeType, webViewLink)",
    spaces: "drive",
  });

  // if the month folder already exists, return early with notification
  if (monthFolderResponse.data.files?.length) {
    return {
      status: "error",
      notification: `Folder for ${monthFolderName} already exists`,
    };
  }

  // if the month folder does not exist (new month), create it
  const monthFolder = await createFolder(
    googleDrive,
    monthFolderName,
    yearFolder.id
  );

  // Finally, try to find or create the invoices folder
  const invoicesFolderQuery =
    `name = 'invoices' and mimeType = 'application/vnd.google-apps.folder' and '${monthFolder.id}' in parents and trashed = false` as const;

  const invoicesFolderResponse = await googleDrive.files.list({
    q: invoicesFolderQuery,
    fields: "files(id, name, mimeType, webViewLink)",
    spaces: "drive",
  });

  let targetFolder: GoogleDriveFile;

  if (invoicesFolderResponse.data.files?.length) {
    // if the invoices folder already exists, use it
    targetFolder = invoicesFolderResponse.data.files[0] as GoogleDriveFile;
  } else {
    // if the invoices folder does not exist, create it
    targetFolder = await createFolder(googleDrive, "invoices", monthFolder.id);
  }

  const invoiceToUploadFolderPath = `/${yearFolder.name}/${monthFolder.name}/${targetFolder.name}`;

  console.log(
    "\n\n________invoice to upload folder path: ",
    invoiceToUploadFolderPath,
    "\n\n"
  );

  return {
    status: "success",
    targetFolder,
    invoiceToUploadFolderPath,
  };
}
