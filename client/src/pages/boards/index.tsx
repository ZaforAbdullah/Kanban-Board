import { useQuery } from '@apollo/client';
import { ProgressSpinner } from 'primereact/progressspinner';
import { GET_BOARDS } from '@/graphql/queries';
import { Board } from '@/types';
import Layout from '@/components/layout/Layout';

export default function BoardsIndexPage() {
  const { data, loading } = useQuery<{ boards: Board[] }>(GET_BOARDS);

  if (loading) {
    return (
      <Layout>
        <div className="boards-loading">
          <ProgressSpinner strokeWidth="4" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="boards-empty-root">
        {data?.boards.length ? (
          <p className="boards-empty-sub">Select a board from the sidebar.</p>
        ) : (
          <>
            <p className="boards-empty-title">No boards yet</p>
            <p className="boards-empty-sub">Create a new board to get started.</p>
          </>
        )}
      </div>
    </Layout>
  );
}
