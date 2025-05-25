import { GraphQLEnumType, GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLFloat, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLScalarType, GraphQLBoolean, Kind } from 'graphql';
import { PrismaClient, Profile as PrismaProfile, User as PrismaUser } from '@prisma/client';

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

export const schema = new GraphQLSchema({
  query: RootQueryType,
});
