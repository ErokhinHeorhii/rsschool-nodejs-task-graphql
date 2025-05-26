import { GraphQLEnumType, GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLFloat, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLScalarType, GraphQLBoolean, Kind, GraphQLInputObjectType } from 'graphql';
import { PrismaClient, Profile as PrismaProfile, User as PrismaUser, Prisma, Post as PrismaPost } from '@prisma/client';

interface SubscriptionParams {
  userId: string;
  authorId: string;
}

const UUID = new GraphQLScalarType({
  name: 'UUID',
  description: 'UUID custom scalar type',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return ast.value;
    }
    return null;
  },
});

const MemberTypeId = new GraphQLEnumType({
  name: 'MemberTypeId',
  values: {
    BASIC: { value: 'BASIC' },
    BUSINESS: { value: 'BUSINESS' },
  },
});

const MemberType = new GraphQLObjectType({
  name: 'MemberType',
  fields: {
    id: { type: new GraphQLNonNull(MemberTypeId) },
    discount: { type: new GraphQLNonNull(GraphQLFloat) },
    postsLimitPerMonth: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

const Post = new GraphQLObjectType({
  name: 'Post',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUID) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) }
  }),
});

const Profile = new GraphQLObjectType({
  name: 'Profile',
  fields: {
    id: { type: new GraphQLNonNull(UUID) },
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    memberType: {
      type: new GraphQLNonNull(MemberType),
      resolve: async (parent: PrismaProfile, _, { prisma }: { prisma: PrismaClient }) => {
        return prisma.memberType.findUnique({ where: { id: parent.memberTypeId } });
      }
    }
  },
});

const User = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
    profile: {
      type: Profile,
      resolve: async (parent: PrismaUser, _, { prisma }: { prisma: PrismaClient }) => {
        return prisma.profile.findUnique({ where: { userId: parent.id } });
      }
    },
    posts: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))),
      resolve: async (parent: PrismaUser, _, { prisma }: { prisma: PrismaClient }) => {
        return prisma.post.findMany({ where: { authorId: parent.id } });
      }
    },
    userSubscribedTo: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
      resolve: async (parent: PrismaUser, _, { prisma }: { prisma: PrismaClient }) => {
        const subscriptions = await prisma.subscribersOnAuthors.findMany({
          where: { subscriberId: parent.id },
          include: { author: true }
        });
        return subscriptions.map(sub => sub.author);
      }
    },
    subscribedToUser: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
      resolve: async (parent: PrismaUser, _, { prisma }: { prisma: PrismaClient }) => {
        const subscribers = await prisma.subscribersOnAuthors.findMany({
          where: { authorId: parent.id },
          include: { subscriber: true }
        });
        return subscribers.map(sub => sub.subscriber);
      }
    }
  }),
});

const CreateUserInput = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
  },
});

const CreateProfileInput = new GraphQLInputObjectType({
  name: 'CreateProfileInput',
  fields: {
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    memberTypeId: { type: new GraphQLNonNull(MemberTypeId) },
    userId: { type: new GraphQLNonNull(UUID) },
  },
});

const CreatePostInput = new GraphQLInputObjectType({
  name: 'CreatePostInput',
  fields: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: new GraphQLNonNull(UUID) },
  },
});

const ChangeUserInput = new GraphQLInputObjectType({
  name: 'ChangeUserInput',
  fields: {
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
  },
});

const ChangeProfileInput = new GraphQLInputObjectType({
  name: 'ChangeProfileInput',
  fields: {
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    memberTypeId: { type: MemberTypeId },
  },
});

const ChangePostInput = new GraphQLInputObjectType({
  name: 'ChangePostInput',
  fields: {
    title: { type: GraphQLString },
    content: { type: GraphQLString },
  },
});

const RootQueryType = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    memberTypes: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(MemberType))),
      resolve: async (_, __, { prisma }: { prisma: PrismaClient }) => {
        return prisma.memberType.findMany();
      },
    },
    memberType: {
      type: MemberType,
      args: {
        id: { type: new GraphQLNonNull(MemberTypeId) },
      },
      resolve: async (_, { id }:{id:string}, { prisma }: { prisma: PrismaClient }) => {
        return prisma.memberType.findUnique({ where: { id } });
      },
    },
    posts: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))),
      resolve: async (_, __, { prisma }: { prisma: PrismaClient }) => {
        return prisma.post.findMany();
      },
    },
    post: {
      type: Post,
      args: {
        id: { type: new GraphQLNonNull(UUID) },
      },
      resolve: async (_, { id }: { id: string }, { prisma }: { prisma: PrismaClient }) => {
        return prisma.post.findUnique({ where: { id } });
      },
    },
    users: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
      resolve: async (_, __, { prisma }: { prisma: PrismaClient }) => {
        return prisma.user.findMany();
      },
    },
    user: {
      type: User as GraphQLObjectType,
      args: {
        id: { type: new GraphQLNonNull(UUID) },
      },
      resolve: async (_, { id }: { id: string }, { prisma }: { prisma: PrismaClient }) => {
        return prisma.user.findUnique({ where: { id } });
      },
    },
    profiles: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Profile))),
      resolve: async (_, __, { prisma }: { prisma: PrismaClient }) => {
        return prisma.profile.findMany();
      },
    },
    profile: {
      type: Profile,
      args: {
        id: { type: new GraphQLNonNull(UUID) },
      },
      resolve: async (_, { id }: { id: string }, { prisma }: { prisma: PrismaClient }) => {
        return prisma.profile.findUnique({ where: { id } });
      },
    },
  },
});

const RootMutationType = new GraphQLObjectType({
  name: 'RootMutationType',
  fields: {
    createUser: {
      type: User as GraphQLObjectType,
      args: {
        dto: { type: new GraphQLNonNull(CreateUserInput) },
      },
      resolve: async (_, { dto }: { dto: Prisma.UserCreateInput }, { prisma }: { prisma: PrismaClient }): Promise<PrismaUser> => {
        return prisma.user.create({ data: dto });
      },
    },
    createProfile: {
      type: Profile,
      args: {
        dto: { type: new GraphQLNonNull(CreateProfileInput) },
      },
      resolve: async (_, { dto }: { dto: Prisma.ProfileCreateInput }, { prisma }: { prisma: PrismaClient }): Promise<PrismaProfile> => {
        return prisma.profile.create({ data: dto });
      },
    },
    createPost: {
      type: Post,
      args: {
        dto: { type: new GraphQLNonNull(CreatePostInput) },
      },
      resolve: async (_, { dto }: { dto: Prisma.PostCreateInput }, { prisma }: { prisma: PrismaClient }): Promise<PrismaPost> => {
        return prisma.post.create({ data: dto });
      },
    },
    deleteUser: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(UUID) },
      },
      resolve: async (_, { id }: { id: string }, { prisma }: { prisma: PrismaClient }) => {
        await prisma.user.delete({ where: { id } });
        return true;
      },
    },
    deleteProfile: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(UUID) },
      },
      resolve: async (_, { id }: { id: string }, { prisma }: { prisma: PrismaClient }) => {
        await prisma.profile.delete({ where: { id } });
        return true;
      },
    },
    deletePost: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(UUID) },
      },
      resolve: async (_, { id }: { id: string }, { prisma }: { prisma: PrismaClient }) => {
        await prisma.post.delete({ where: { id } });
        return true;
      },
    },
    changeUser: {
      type: User as GraphQLObjectType,
      args: {
        id: { type: new GraphQLNonNull(UUID) },
        dto: { type: new GraphQLNonNull(ChangeUserInput) },
      },
      resolve: async (_, { id, dto }: { id: string; dto: Prisma.UserUpdateInput }, { prisma }: { prisma: PrismaClient }): Promise<PrismaUser> => {
        return prisma.user.update({ where: { id }, data: dto });
      },
    },
    changeProfile: {
      type: Profile,
      args: {
        id: { type: new GraphQLNonNull(UUID) },
        dto: { type: new GraphQLNonNull(ChangeProfileInput) },
      },
      resolve: async (_, { id, dto }: { id: string; dto: Prisma.ProfileUpdateInput }, { prisma }: { prisma: PrismaClient }): Promise<PrismaProfile> => {
        return prisma.profile.update({ where: { id }, data: dto });
      },
    },
    changePost: {
      type: Post,
      args: {
        id: { type: new GraphQLNonNull(UUID) },
        dto: { type: new GraphQLNonNull(ChangePostInput) },
      },
      resolve: async (_, { id, dto }: { id: string; dto: Prisma.PostUpdateInput }, { prisma }: { prisma: PrismaClient }): Promise<PrismaPost> => {
        return prisma.post.update({ where: { id }, data: dto });
      },
    },
    subscribeTo: {
      type: GraphQLBoolean,
      args: {
        userId: { type: new GraphQLNonNull(UUID) },
        authorId: { type: new GraphQLNonNull(UUID) },
      },
      resolve: async (_, { userId, authorId }: SubscriptionParams, { prisma }: { prisma: PrismaClient }): Promise<boolean> => {
        await prisma.subscribersOnAuthors.create({
          data: {
            subscriberId: userId,
            authorId,
          },
        });
        return true;
      },
    },
    unsubscribeFrom: {
      type: GraphQLBoolean,
      args: {
        userId: { type: new GraphQLNonNull(UUID) },
        authorId: { type: new GraphQLNonNull(UUID) },
      },
      resolve: async (_, { userId, authorId }: SubscriptionParams, { prisma }: { prisma: PrismaClient }): Promise<boolean> => {
        await prisma.subscribersOnAuthors.delete({
          where: {
            subscriberId_authorId: {
              subscriberId: userId,
              authorId,
            },
          },
        });
        return true;
      },
    },
  },
});

export const schema = new GraphQLSchema({
  query: RootQueryType,
  mutation: RootMutationType,
});
