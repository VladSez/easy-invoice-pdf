import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { CustomTooltip } from "@/components/ui/tooltip";

/**
 * A component that displays a label with an edit icon and a tooltip.
 */
export const LabelWithEditIcon = ({
  htmlFor,
  children,
  content,
}: {
  htmlFor: string;
  children: React.ReactNode;
  content: string;
}) => {
  return (
    <div className="flex items-center gap-1">
      <Label htmlFor={htmlFor} className="mb-1">
        {children}
      </Label>
      <div className="hidden md:block">
        <CustomTooltip
          trigger={
            <Info className="mb-1 h-3.5 w-3.5 cursor-pointer text-gray-800" />
          }
          content={content}
        />
      </div>
      <div className="block md:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <Info className="mb-1 h-3.5 w-3.5 cursor-pointer text-gray-800" />
          </PopoverTrigger>
          <PopoverContent className="w-[200px] text-sm">
            {content}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
