import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Topic } from '../shared/models/Topic';

@Injectable()
export class SystemService {
  constructor(
    @InjectModel(Topic)
    private topicModel: typeof Topic,
  ) {}

  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getCategoriesWithTopics(): Promise<{ category: string; topics: any[] }[]> {
    const topics = await this.topicModel.findAll();
    
    // Group topics by category
    const groupedByCategory = topics.reduce((acc, topic) => {
      const category = topic.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: topic.id,
        name: topic.name,
        description: topic.description,
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Convert to array format
    return Object.keys(groupedByCategory).map((category) => ({
      category,
      topics: groupedByCategory[category],
    }));
  }
}

