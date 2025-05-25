import { GraphQLEnumType, GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLFloat, GraphQLInt, GraphQLList, GraphQLNonNull } from 'graphql';
import { PrismaClient } from '@prisma/client';

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

const RootQueryType = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    memberTypes: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(MemberType))),
      resolve: async (_, __, { prisma }: { prisma: PrismaClient }) => {
        return prisma.memberType.findMany();
      },
    },
  },
});

export const schema = new GraphQLSchema({
  query: RootQueryType,
});
