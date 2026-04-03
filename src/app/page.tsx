import dynamic from "next/dynamic";

const PasswordGate = dynamic(() => import("@/components/PasswordGate"), { ssr: false });
const InspirationGallery = dynamic(() => import("@/components/InspirationGallery"), { ssr: false });

export default function Home() {
  return (
    <PasswordGate>
      <InspirationGallery />
    </PasswordGate>
  );
}
