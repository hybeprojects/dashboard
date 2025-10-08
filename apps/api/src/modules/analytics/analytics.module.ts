import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { AnalyticsResolver } from './analytics.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: ApolloDriver as any,
      autoSchemaFile: true,
      path: '/graphql',
    }),
  ],
  providers: [AnalyticsResolver],
})
export class AnalyticsModule {}
