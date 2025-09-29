import clsx from "clsx";

export const styles = {
  base: "mx-auto w-[min(var(--container-max-width),100%---spacing(12))]",
  size: {
    sm: "[--container-max-width:50rem]",
    default: "[--container-max-width:90rem]",
    prose: "[--container-max-width:65ch]",
    fluid: "[--container-max-width:100%]",
  },
};

export type ContainerBaseProps = {
  size?: keyof typeof styles.size;
};

export type ContainerProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> &
  ContainerBaseProps & {
    as?: T;
    ref?: React.Ref<HTMLDivElement>;
  };

export function Container<T extends React.ElementType = "div">({
  as,
  size = "default",
  ref,
  ...props
}: ContainerProps<T>) {
  const Element = as || "div";
  return (
    <Element
      {...props}
      ref={ref}
      className={clsx(styles.base, styles.size[size], props.className)}
    />
  );
}
