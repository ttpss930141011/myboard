import { Canvas } from './_components/canvas'

interface BoardIdPageProps {
  params: { boardId: string }
}

const BoardIdPage = ({ params }: BoardIdPageProps) => (
  <Canvas boardId={params.boardId} />
)

export default BoardIdPage
