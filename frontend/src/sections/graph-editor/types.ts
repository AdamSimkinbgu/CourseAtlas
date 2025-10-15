export type ContainerShape = {
  id: string;
  title: string;
  palette_id?: string | null;
  color: string;
  width: number;
  height: number;
  position: { x: number; y: number };
};
