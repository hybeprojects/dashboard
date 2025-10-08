import { Query, Resolver, ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class SeriesPoint { @Field() label!: string; @Field(() => Number) value!: number; }

@Resolver()
export class AnalyticsResolver {
  @Query(() => [SeriesPoint])
  cashflowSeries(): SeriesPoint[] {
    return Array.from({ length: 12 }, (_, i) => ({ label: `M${i + 1}`, value: Math.round(Math.random() * 1000) }));
  }
}
