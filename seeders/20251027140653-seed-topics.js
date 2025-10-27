'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    // Software Engineering topics
    const softwareEngineeringTopics = [
      { name: 'dev', description: 'General software development practices and methodologies' },
      { name: 'docker', description: 'Containerization with Docker' },
      { name: 'k8s', description: 'Kubernetes orchestration platform' },
      { name: 'microservices', description: 'Microservices architecture patterns' },
      { name: 'rest-api', description: 'RESTful API design and development' },
      { name: 'graphql', description: 'GraphQL query language and runtime' },
      { name: 'nodejs', description: 'Node.js runtime environment' },
      { name: 'python', description: 'Python programming language' },
      { name: 'javascript', description: 'JavaScript programming language' },
      { name: 'typescript', description: 'TypeScript typed superset of JavaScript' },
      { name: 'react', description: 'React UI library' },
      { name: 'vue', description: 'Vue.js progressive framework' },
      { name: 'angular', description: 'Angular web application framework' },
      { name: 'nextjs', description: 'Next.js React framework' },
      { name: 'nestjs', description: 'NestJS Node.js framework' },
      { name: 'express', description: 'Express.js web framework' },
      { name: 'database', description: 'Database management systems' },
      { name: 'postgresql', description: 'PostgreSQL relational database' },
      { name: 'mongodb', description: 'MongoDB NoSQL database' },
      { name: 'redis', description: 'Redis in-memory data store' },
      { name: 'git', description: 'Git version control system' },
      { name: 'github', description: 'GitHub code hosting platform' },
      { name: 'gitlab', description: 'GitLab DevOps platform' },
      { name: 'ci-cd', description: 'Continuous Integration and Deployment' },
      { name: 'testing', description: 'Software testing methodologies' },
      { name: 'tdd', description: 'Test-Driven Development' },
      { name: 'agile', description: 'Agile software development methodology' },
      { name: 'scrum', description: 'Scrum project management framework' },
      { name: 'aws', description: 'Amazon Web Services cloud platform' },
      { name: 'azure', description: 'Microsoft Azure cloud services' },
      { name: 'gcp', description: 'Google Cloud Platform' },
      { name: 'terraform', description: 'Terraform infrastructure as code' },
      { name: 'ansible', description: 'Ansible configuration management' },
      { name: 'prometheus', description: 'Prometheus monitoring and alerting' },
      { name: 'grafana', description: 'Grafana visualization and analytics' },
      { name: 'elasticsearch', description: 'Elasticsearch search and analytics engine' },
      { name: 'kafka', description: 'Apache Kafka event streaming platform' },
      { name: 'rabbitmq', description: 'RabbitMQ message broker' },
      { name: 'nginx', description: 'Nginx web server and reverse proxy' },
      { name: 'apache', description: 'Apache HTTP server' },
    ];

    // Psychology topics
    const psychologyTopics = [
      { name: 'cognitive-psychology', description: 'Study of mental processes' },
      { name: 'behavioral-psychology', description: 'Analysis of behavior patterns' },
      { name: 'clinical-psychology', description: 'Mental health and treatment' },
      { name: 'developmental-psychology', description: 'Human development across lifespan' },
      { name: 'social-psychology', description: 'Social interactions and influences' },
      { name: 'neuropsychology', description: 'Relationship between brain and behavior' },
      { name: 'psychotherapy', description: 'Therapeutic treatment methods' },
      { name: 'counseling', description: 'Professional counseling services' },
      { name: 'mindfulness', description: 'Mindfulness and meditation practices' },
      { name: 'mental-health', description: 'General mental health awareness' },
      { name: 'anxiety', description: 'Anxiety disorders and management' },
      { name: 'depression', description: 'Depression understanding and treatment' },
      { name: 'personality', description: 'Personality psychology' },
      { name: 'learning', description: 'Learning and memory processes' },
      { name: 'emotion', description: 'Emotional intelligence and regulation' },
    ];

    // Paranormal Activity topics
    const paranormalTopics = [
      { name: 'ghosts', description: 'Apparitions and spirits' },
      { name: 'hauntings', description: 'Haunted locations and experiences' },
      { name: 'ufo', description: 'UFO sightings and investigations' },
      { name: 'aliens', description: 'Extraterrestrial encounters' },
      { name: 'cryptids', description: 'Mythological creatures and cryptids' },
      { name: 'psychic-phenomena', description: 'Psychic abilities and phenomena' },
      { name: 'paranormal-investigation', description: 'Paranormal research methods' },
      { name: 'supernatural', description: 'Supernatural events and occurrences' },
      { name: 'spiritualism', description: 'Spiritual and metaphysical practices' },
      { name: 'mediumship', description: 'Communication with spirits' },
      { name: 'parapsychology', description: 'Scientific study of paranormal phenomena' },
      { name: 'near-death-experiences', description: 'NDE accounts and analysis' },
    ];

    // Science topics
    const scienceTopics = [
      { name: 'physics', description: 'Physical sciences and laws' },
      { name: 'chemistry', description: 'Chemical sciences' },
      { name: 'biology', description: 'Life sciences' },
      { name: 'astronomy', description: 'Study of celestial objects' },
      { name: 'quantum-physics', description: 'Quantum mechanics' },
      { name: 'neuroscience', description: 'Nervous system research' },
      { name: 'genetics', description: 'Genetic sciences' },
      { name: 'climate-science', description: 'Climate and environmental science' },
    ];

    // Technology topics
    const technologyTopics = [
      { name: 'iot', description: 'Internet of Things' },
      { name: 'blockchain', description: 'Blockchain technology and cryptocurrencies' },
      { name: 'web3', description: 'Web3 and decentralized technologies' },
      { name: 'ar-vr', description: 'Augmented and Virtual Reality' },
      { name: 'robotics', description: 'Robotics and automation' },
      { name: 'quantum-computing', description: 'Quantum computing systems' },
      { name: 'nanotechnology', description: 'Nano-scale technologies' },
      { name: '5g', description: '5G wireless networks' },
    ];

    // Business topics
    const businessTopics = [
      { name: 'startup', description: 'Startup ecosystem and entrepreneurship' },
      { name: 'fintech', description: 'Financial technology innovations' },
      { name: 'ecommerce', description: 'Electronic commerce platforms' },
      { name: 'saas', description: 'Software as a Service business model' },
      { name: 'investment', description: 'Investment strategies and markets' },
      { name: 'crypto-trading', description: 'Cryptocurrency trading' },
    ];

    // Design topics
    const designTopics = [
      { name: 'ui-design', description: 'User Interface design principles' },
      { name: 'ux-design', description: 'User Experience design methodologies' },
      { name: 'graphic-design', description: 'Visual communication design' },
      { name: 'web-design', description: 'Website design and layout' },
      { name: 'motion-design', description: 'Animation and motion graphics' },
    ];

    // Data Science topics
    const dataScienceTopics = [
      { name: 'data-analysis', description: 'Data analysis and interpretation' },
      { name: 'data-visualization', description: 'Presenting data visually' },
      { name: 'big-data', description: 'Processing large datasets' },
      { name: 'sql', description: 'Structured Query Language' },
      { name: 'pandas', description: 'Python data analysis library' },
      { name: 'numpy', description: 'Numerical computing with Python' },
    ];

    const allTopics = [
      ...softwareEngineeringTopics.map(t => ({ ...t, category: 'Software Engineering' })),
      ...psychologyTopics.map(t => ({ ...t, category: 'Psychology' })),
      ...paranormalTopics.map(t => ({ ...t, category: 'Paranormal Activity' })),
      ...scienceTopics.map(t => ({ ...t, category: 'Science' })),
      ...technologyTopics.map(t => ({ ...t, category: 'Technology' })),
      ...businessTopics.map(t => ({ ...t, category: 'Business' })),
      ...designTopics.map(t => ({ ...t, category: 'Design' })),
      ...dataScienceTopics.map(t => ({ ...t, category: 'Data Science' })),
    ];

    // Add timestamps to all topics
    const topicsWithTimestamps = allTopics.map(topic => ({
      ...topic,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const table = { tableName: 'topics', schema: 'public' };
    await queryInterface.bulkInsert(table, topicsWithTimestamps);
  },

  async down(queryInterface, Sequelize) {
    const table = { tableName: 'topics', schema: 'public' };
    await queryInterface.bulkDelete(table, null, {});
  },
};
