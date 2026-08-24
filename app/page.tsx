import { LibraryApp } from "./components/library-app";
import { getSeedCatalog } from "../lib/seed-catalog";

export default function Home() {
  return <LibraryApp initial={getSeedCatalog()} />;
}
