import { Canvas } from './_components/canvas'

interface BoardIdPageProps {
  params: Promise<{ boardId: string }>
}

const BoardIdPage = async (props: BoardIdPageProps) => {
  const params = await props.params;
  return (<Canvas boardId={params.boardId} />);
}

export default BoardIdPage
