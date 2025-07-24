"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type PointerDownEvent = Parameters<
  NonNullable<DropdownMenuPrimitive.DropdownMenuContentProps["onPointerDown"]>
>[0];
type PointerDownOutsideEvent = Parameters<
  NonNullable<
    DropdownMenuPrimitive.DropdownMenuContentProps["onPointerDownOutside"]
  >
>[0];

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  onPointerDown,
  onPointerDownOutside,
  onCloseAutoFocus,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  const isCloseFromMouse = React.useRef<boolean>(false);

  const handlePointerDown = React.useCallback(
    (e: PointerDownEvent) => {
      isCloseFromMouse.current = true;
      onPointerDown?.(e);
    },
    [onPointerDown]
  );

  const handlePointerDownOutside = React.useCallback(
    (e: PointerDownOutsideEvent) => {
      isCloseFromMouse.current = true;
      onPointerDownOutside?.(e);
    },
    [onPointerDownOutside]
  );

  const handleCloseAutoFocus = React.useCallback(
    (e: Event) => {
      if (onCloseAutoFocus) {
        return onCloseAutoFocus(e);
      }

      if (!isCloseFromMouse.current) {
        return;
      }

      e.preventDefault();
      isCloseFromMouse.current = false;
    },
    [onCloseAutoFocus]
  );

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          `
            z-50 min-w-40 overflow-hidden rounded-md border border-slate-200 bg-white p-1
            text-slate-950 shadow-lg
            data-[side=bottom]:slide-in-from-top-2
            data-[side=left]:slide-in-from-right-2
            data-[side=right]:slide-in-from-left-2
            data-[side=top]:slide-in-from-bottom-2
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0
            data-[state=closed]:zoom-out-95
            data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
            dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50
          `,
          className
        )}
        onPointerDown={handlePointerDown}
        onPointerDownOutside={handlePointerDownOutside}
        onCloseAutoFocus={handleCloseAutoFocus}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        `
          relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm
          outline-hidden select-none
          hover:bg-slate-100 hover:text-slate-900
          data-disabled:pointer-events-none data-disabled:opacity-50
          data-highlighted:bg-slate-100 data-highlighted:text-slate-900
          data-highlighted:outline-hidden
          data-inset:pl-8
          data-[variant=destructive]:text-slate-50 data-[variant=destructive]:hover:bg-red-500/10
          data-[variant=destructive]:hover:text-slate-50
          data-[variant=destructive]:data-highlighted:bg-red-500/10
          data-[variant=destructive]:data-highlighted:text-slate-50
          dark:hover:bg-slate-800 dark:hover:text-slate-50 dark:data-highlighted:bg-slate-800
          dark:data-highlighted:text-slate-50 dark:data-[variant=destructive]:text-slate-50
          dark:data-[variant=destructive]:hover:bg-red-900/10
          dark:data-[variant=destructive]:hover:text-slate-50
          dark:data-[variant=destructive]:data-highlighted:bg-red-900/10
          dark:data-[variant=destructive]:data-highlighted:text-slate-50
          [&_svg]:pointer-events-none [&_svg]:shrink-0
          data-[variant=destructive]:*:[svg]:!text-destructive-foreground
        `,
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        `
          relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm
          outline-hidden select-none
          focus:bg-slate-100 focus:text-slate-900
          data-disabled:pointer-events-none data-disabled:opacity-50
          dark:focus:bg-slate-800 dark:focus:text-slate-50
          [&_svg]:pointer-events-none [&_svg]:shrink-0
        `,
        className
      )}
      checked={checked}
      {...props}
    >
      <span
        className={`pointer-events-none absolute left-2 flex size-3.5 items-center justify-center`}
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon size={16} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        `
          relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm
          outline-hidden select-none
          focus:bg-slate-100 focus:text-slate-900
          data-disabled:pointer-events-none data-disabled:opacity-50
          dark:focus:bg-slate-800 dark:focus:text-slate-50
          [&_svg]:pointer-events-none [&_svg]:shrink-0
        `,
        className
      )}
      {...props}
    >
      <span
        className={`pointer-events-none absolute left-2 flex size-3.5 items-center justify-center`}
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        `
          px-2 py-1.5 text-xs font-medium text-slate-500
          data-inset:pl-8
          dark:text-slate-400
        `,
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(
        `
          -mx-1 my-1 h-px bg-slate-200
          dark:bg-slate-800
        `,
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <kbd
      data-slot="dropdown-menu-shortcut"
      className={cn(
        `
          ms-auto -me-1 inline-flex h-5 max-h-full items-center rounded border border-slate-200
          bg-white px-1 font-[inherit] text-[0.625rem] font-medium text-slate-500/70
          dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400/70
        `,
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        `
          flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none
          focus:bg-slate-100 focus:text-slate-900
          data-inset:pl-8
          data-[state=open]:bg-slate-100 data-[state=open]:text-slate-900
          dark:focus:bg-slate-800 dark:focus:text-slate-50 dark:data-[state=open]:bg-slate-800
          dark:data-[state=open]:text-slate-50
        `,
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon
        size={16}
        className={`
          ml-auto text-slate-500/80
          dark:text-slate-400/80
        `}
      />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        `
          z-50 min-w-40 overflow-hidden rounded-md border border-slate-200 bg-white p-1
          text-slate-950 shadow-lg
          data-[side=bottom]:slide-in-from-top-2
          data-[side=left]:slide-in-from-right-2
          data-[side=right]:slide-in-from-left-2
          data-[side=top]:slide-in-from-bottom-2
          data-[state=closed]:animate-out data-[state=closed]:fade-out-0
          data-[state=closed]:zoom-out-95
          data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
          dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50
        `,
        className
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
