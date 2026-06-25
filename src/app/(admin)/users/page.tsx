import { Metadata } from "next";
import UsersClient from "@/components/users/UsersClient";
import RouteGuard from "@/components/auth/RouteGuard";

export const metadata: Metadata = {
  title: "Gestion Utilisateurs | TailAdmin - Dashboard RH",
  description: "Page de gestion des utilisateurs du système RH",
};

export default function Users() {
  return (
    <RouteGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
      <UsersClient />
    </RouteGuard>
  );
}
