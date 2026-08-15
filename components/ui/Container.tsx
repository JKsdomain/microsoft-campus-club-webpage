import React from "react";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className = "",
  as: Component = "div",
  ...props
}) => {
  return (
    <Component
      className={`max-w-[1280px] mx-auto px-5 sm:px-6 md:px-8 w-full ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
