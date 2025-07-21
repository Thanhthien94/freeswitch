import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // TODO: Extract user from JWT token
    // For now, return mock user
    return {
      id: 1,
      username: 'admin',
      roles: ['superadmin'],
    };
  },
);
