import { Metadata } from "next";
import UsersClient from "@/components/users/UsersClient";

export const metadata: Metadata = {
  title: "Gestion Utilisateurs | TailAdmin - Dashboard RH",
  description: "Page de gestion des utilisateurs du système RH",
};

export default function Users() {
  return <UsersClient />;
}
