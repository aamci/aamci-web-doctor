import DoctorClient from './DoctorClient';

export default async function Page(
  { params }: { params: Promise<{ id: string }> } // 👈 Promise ici
) {
  const { id } = await params;                   // 👈 on attend la Promise
  return <DoctorClient id={id} />;
}