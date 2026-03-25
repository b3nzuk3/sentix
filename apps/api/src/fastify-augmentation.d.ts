declare module 'fastify' {
  interface FastifyInstance {
    prisma: any;
    authenticate: any;
  }

  interface FastifyRequest {
    user: {
      id: string;
      organization_id: string;
      role: string;
    };
    prisma: any;
    redis: any;
  }

  interface FastifyFile {
    buffer: Buffer;
    name: string;
    mimetype: string;
    size: number;
  };
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      user_id: string;
      org_id: string;
      role: string;
    };
  }
}

export {};
