import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesService } from '../../roles/roles.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolesService: RolesService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true; // Pas de permissions requises
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // Récupérer les permissions de l'utilisateur
    const userPermissions = await this.rolesService.getUserPermissions(user.id);

    console.log(`[PermissionsGuard] User: ${user.id} (${user.username}), Role: ${user.role}`);
    console.log(`[PermissionsGuard] Required: ${JSON.stringify(requiredPermissions)}`);
    console.log(`[PermissionsGuard] User Permissions: ${JSON.stringify(userPermissions)}`);

    // Vérifier si l'utilisateur a toutes les permissions requises
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      console.error(`[PermissionsGuard] Check failed. Missing permissions.`);
      throw new ForbiddenException(
        `Permissions insuffisantes. Permissions requises: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }
}
