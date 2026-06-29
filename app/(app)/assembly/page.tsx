import { AssemblyTable } from '@features/assembly/components/assembly-table'
import { MOCK_ASSEMBLIES } from '@features/assembly/mock-data'

export default function AssemblyPage() {
  return (
    <main className="p-6">
      <AssemblyTable assemblies={MOCK_ASSEMBLIES} />
    </main>
  )
}
