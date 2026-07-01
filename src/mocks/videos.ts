import type { Designation } from './designations';

export interface Video {
  id: string;
  title: string;
  veedUrl: string;
  designation: Designation;
  sortOrder: number;
  duration: string;
  thumbnail: string;
}

export const videos: Video[] = [
  // Sales videos
  {
    id: 'vid-001',
    title: 'Introduction to Consultative Selling',
    veedUrl: 'https://www.veed.io/embed/example-001',
    designation: 'Sales',
    sortOrder: 1,
    duration: '12:34',
    thumbnail: 'https://readdy.ai/api/search-image?query=Professional%20sales%20consultant%20in%20modern%20office%20meeting%20room%20with%20warm%20ambient%20lighting%2C%20clean%20professional%20setting%2C%20corporate%20training%20environment%2C%20soft%20natural%20light%20from%20large%20windows%2C%20minimalist%20interior%20with%20wooden%20accents%2C%20warm%20neutral%20color%20palette&width=640&height=360&seq=vid-thumb-001&orientation=landscape',
  },
  {
    id: 'vid-002',
    title: 'Handling Customer Objections',
    veedUrl: 'https://www.veed.io/embed/example-002',
    designation: 'Sales',
    sortOrder: 2,
    duration: '15:20',
    thumbnail: 'https://readdy.ai/api/search-image?query=Two%20business%20professionals%20engaged%20in%20discussion%20across%20a%20modern%20desk%2C%20warm%20office%20setting%20with%20green%20plants%2C%20collaborative%20environment%2C%20soft%20overhead%20lighting%2C%20professional%20yet%20relaxed%20atmosphere%2C%20clean%20minimalist%20aesthetic&width=640&height=360&seq=vid-thumb-002&orientation=landscape',
  },
  {
    id: 'vid-003',
    title: 'Closing Techniques That Work',
    veedUrl: 'https://www.veed.io/embed/example-003',
    designation: 'Sales',
    sortOrder: 3,
    duration: '18:45',
    thumbnail: 'https://readdy.ai/api/search-image?query=Confident%20business%20professional%20shaking%20hands%20in%20bright%20modern%20office%20lobby%2C%20successful%20deal%20closure%20scene%2C%20warm%20natural%20light%2C%20glass%20walls%20with%20city%20view%2C%20professional%20corporate%20setting%2C%20clean%20and%20polished%20interior&width=640&height=360&seq=vid-thumb-003&orientation=landscape',
  },
  {
    id: 'vid-004',
    title: 'Building Long-Term Client Relationships',
    veedUrl: 'https://www.veed.io/embed/example-004',
    designation: 'Sales',
    sortOrder: 4,
    duration: '14:10',
    thumbnail: 'https://readdy.ai/api/search-image?query=Warm%20coffee%20meeting%20between%20two%20professionals%20in%20cozy%20cafe%20setting%2C%20relationship%20building%20concept%2C%20soft%20warm%20lighting%2C%20wooden%20furniture%2C%20relaxed%20business%20atmosphere%2C%20genuine%20connection%20vibe&width=640&height=360&seq=vid-thumb-004&orientation=landscape',
  },

  // Operations videos
  {
    id: 'vid-005',
    title: 'Operations Fundamentals & Workflow',
    veedUrl: 'https://www.veed.io/embed/example-005',
    designation: 'Operations',
    sortOrder: 1,
    duration: '10:15',
    thumbnail: 'https://readdy.ai/api/search-image?query=Modern%20warehouse%20or%20operations%20center%20with%20organized%20workflow%20visualization%2C%20clean%20industrial%20setting%2C%20efficient%20processes%20displayed%20on%20screens%2C%20warm%20industrial%20lighting%2C%20professional%20operations%20management%20environment&width=640&height=360&seq=vid-thumb-005&orientation=landscape',
  },
  {
    id: 'vid-006',
    title: 'Supply Chain Best Practices',
    veedUrl: 'https://www.veed.io/embed/example-006',
    designation: 'Operations',
    sortOrder: 2,
    duration: '16:40',
    thumbnail: 'https://readdy.ai/api/search-image?query=Aerial%20view%20of%20organized%20logistics%20and%20supply%20chain%20operations%2C%20neatly%20arranged%20shipping%20containers%2C%20efficient%20workflow%20design%2C%20warm%20sunset%20lighting%2C%20clean%20industrial%20aesthetic&width=640&height=360&seq=vid-thumb-006&orientation=landscape',
  },
  {
    id: 'vid-007',
    title: 'Quality Control & Process Optimization',
    veedUrl: 'https://www.veed.io/embed/example-007',
    designation: 'Operations',
    sortOrder: 3,
    duration: '13:25',
    thumbnail: 'https://readdy.ai/api/search-image?query=Quality%20control%20inspector%20examining%20product%20in%20clean%20modern%20facility%2C%20white%20and%20sterile%20environment%2C%20professional%20precision%20work%2C%20bright%20even%20lighting%2C%20minimalist%20industrial%20design&width=640&height=360&seq=vid-thumb-007&orientation=landscape',
  },

  // HR videos
  {
    id: 'vid-008',
    title: 'Recruitment & Talent Acquisition',
    veedUrl: 'https://www.veed.io/embed/example-008',
    designation: 'HR',
    sortOrder: 1,
    duration: '14:50',
    thumbnail: 'https://readdy.ai/api/search-image?query=Professional%20HR%20interview%20setting%20in%20modern%20office%2C%20two%20people%20having%20conversation%2C%20warm%20friendly%20atmosphere%2C%20plants%20and%20natural%20light%2C%20clean%20corporate%20interior%20with%20glass%20partitions&width=640&height=360&seq=vid-thumb-008&orientation=landscape',
  },
  {
    id: 'vid-009',
    title: 'Employee Onboarding Best Practices',
    veedUrl: 'https://www.veed.io/embed/example-009',
    designation: 'HR',
    sortOrder: 2,
    duration: '11:30',
    thumbnail: 'https://readdy.ai/api/search-image?query=Welcoming%20office%20orientation%20session%20with%20diverse%20group%20of%20new%20employees%2C%20bright%20modern%20conference%20room%2C%20friendly%20atmosphere%2C%20natural%20daylight%2C%20clean%20professional%20setting&width=640&height=360&seq=vid-thumb-009&orientation=landscape',
  },
  {
    id: 'vid-010',
    title: 'Performance Management Systems',
    veedUrl: 'https://www.veed.io/embed/example-010',
    designation: 'HR',
    sortOrder: 3,
    duration: '15:15',
    thumbnail: 'https://readdy.ai/api/search-image?query=Manager%20having%20one%20on%20one%20performance%20review%20meeting%20with%20employee%2C%20modern%20private%20office%20setting%2C%20warm%20supportive%20environment%2C%20soft%20lighting%2C%20professional%20development%20concept&width=640&height=360&seq=vid-thumb-010&orientation=landscape',
  },

  // IT videos
  {
    id: 'vid-011',
    title: 'Cybersecurity Awareness for Staff',
    veedUrl: 'https://www.veed.io/embed/example-011',
    designation: 'IT',
    sortOrder: 1,
    duration: '20:00',
    thumbnail: 'https://readdy.ai/api/search-image?query=Digital%20security%20concept%20with%20lock%20icon%20on%20screen%2C%20modern%20IT%20workspace%20with%20multiple%20monitors%2C%20dark%20theme%20with%20warm%20accent%20lighting%2C%20clean%20tech%20office%20environment&width=640&height=360&seq=vid-thumb-011&orientation=landscape',
  },
  {
    id: 'vid-012',
    title: 'IT Support & Troubleshooting',
    veedUrl: 'https://www.veed.io/embed/example-012',
    designation: 'IT',
    sortOrder: 2,
    duration: '17:30',
    thumbnail: 'https://readdy.ai/api/search-image?query=IT%20professional%20working%20at%20help%20desk%20assisting%20colleague%2C%20modern%20office%20tech%20support%20setting%2C%20warm%20indoor%20lighting%2C%20organized%20workspace%20with%20screens%20and%20equipment&width=640&height=360&seq=vid-thumb-012&orientation=landscape',
  },

  // Finance videos
  {
    id: 'vid-013',
    title: 'Financial Reporting Standards',
    veedUrl: 'https://www.veed.io/embed/example-013',
    designation: 'Finance',
    sortOrder: 1,
    duration: '16:20',
    thumbnail: 'https://readdy.ai/api/search-image?query=Financial%20analyst%20reviewing%20reports%20on%20large%20screen%20with%20charts%20and%20graphs%2C%20modern%20corporate%20office%2C%20warm%20professional%20lighting%2C%20clean%20organized%20desk%2C%20minimalist%20interior&width=640&height=360&seq=vid-thumb-013&orientation=landscape',
  },
  {
    id: 'vid-014',
    title: 'Budget Planning & Forecasting',
    veedUrl: 'https://www.veed.io/embed/example-014',
    designation: 'Finance',
    sortOrder: 2,
    duration: '14:45',
    thumbnail: 'https://readdy.ai/api/search-image?query=Team%20of%20finance%20professionals%20collaborating%20around%20whiteboard%20with%20budget%20projections%2C%20bright%20modern%20meeting%20room%2C%20natural%20light%20from%20windows%2C%20professional%20corporate%20environment&width=640&height=360&seq=vid-thumb-014&orientation=landscape',
  },

  // Front Desk videos
  {
    id: 'vid-015',
    title: 'Front Desk Etiquette & Customer Service',
    veedUrl: 'https://www.veed.io/embed/example-015',
    designation: 'Front Desk',
    sortOrder: 1,
    duration: '10:30',
    thumbnail: 'https://readdy.ai/api/search-image?query=Elegant%20hotel%20or%20office%20reception%20desk%20with%20friendly%20staff%20greeting%20guest%2C%20warm%20welcoming%20atmosphere%2C%20modern%20lobby%20design%2C%20soft%20ambient%20lighting%2C%20professional%20hospitality%20setting&width=640&height=360&seq=vid-thumb-015&orientation=landscape',
  },
  {
    id: 'vid-016',
    title: 'Handling Difficult Visitors & Calls',
    veedUrl: 'https://www.veed.io/embed/example-016',
    designation: 'Front Desk',
    sortOrder: 2,
    duration: '12:15',
    thumbnail: 'https://readdy.ai/api/search-image?query=Professional%20receptionist%20handling%20phone%20call%20at%20modern%20front%20desk%2C%20calm%20composed%20expression%2C%20clean%20corporate%20lobby%2C%20warm%20indoor%20lighting%2C%20organized%20workspace&width=640&height=360&seq=vid-thumb-016&orientation=landscape',
  },

  // Housekeeping videos
  {
    id: 'vid-017',
    title: 'Housekeeping Standards & Protocols',
    veedUrl: 'https://www.veed.io/embed/example-017',
    designation: 'Housekeeping',
    sortOrder: 1,
    duration: '11:20',
    thumbnail: 'https://readdy.ai/api/search-image?query=Clean%20and%20organized%20hotel%20room%20with%20professional%20housekeeping%20standards%2C%20neatly%20made%20bed%20with%20crisp%20white%20linens%2C%20warm%20natural%20light%2C%20immaculate%20setting%2C%20hospitality%20industry&width=640&height=360&seq=vid-thumb-017&orientation=landscape',
  },
  {
    id: 'vid-018',
    title: 'Safety & Hygiene Best Practices',
    veedUrl: 'https://www.veed.io/embed/example-018',
    designation: 'Housekeeping',
    sortOrder: 2,
    duration: '13:40',
    thumbnail: 'https://readdy.ai/api/search-image?query=Professional%20cleaning%20staff%20using%20modern%20equipment%20in%20bright%20clean%20facility%2C%20safety%20gear%20and%20hygiene%20protocols%2C%20well%20lit%20environment%2C%20professional%20cleaning%20service%20setting&width=640&height=360&seq=vid-thumb-018&orientation=landscape',
  },

  // Management videos
  {
    id: 'vid-019',
    title: 'Leadership & Team Management',
    veedUrl: 'https://www.veed.io/embed/example-019',
    designation: 'Management',
    sortOrder: 1,
    duration: '19:00',
    thumbnail: 'https://readdy.ai/api/search-image?query=Confident%20business%20leader%20presenting%20to%20diverse%20team%20in%20modern%20boardroom%2C%20inspiring%20leadership%20scene%2C%20warm%20professional%20lighting%2C%20glass%20walls%20with%20city%20view%2C%20corporate%20excellence&width=640&height=360&seq=vid-thumb-019&orientation=landscape',
  },
  {
    id: 'vid-020',
    title: 'Strategic Decision Making',
    veedUrl: 'https://www.veed.io/embed/example-020',
    designation: 'Management',
    sortOrder: 2,
    duration: '16:30',
    thumbnail: 'https://readdy.ai/api/search-image?query=Executive%20team%20in%20strategic%20planning%20session%20around%20conference%20table%2C%20modern%20boardroom%20with%20large%20screen%20displaying%20data%2C%20warm%20ambient%20lighting%2C%20professional%20corporate%20environment&width=640&height=360&seq=vid-thumb-020&orientation=landscape',
  },
  {
    id: 'vid-021',
    title: 'Conflict Resolution in the Workplace',
    veedUrl: 'https://www.veed.io/embed/example-021',
    designation: 'Management',
    sortOrder: 3,
    duration: '14:20',
    thumbnail: 'https://readdy.ai/api/search-image?query=Mediator%20facilitating%20constructive%20discussion%20between%20two%20colleagues%20in%20private%20office%2C%20calm%20supportive%20environment%2C%20warm%20natural%20light%2C%20professional%20conflict%20resolution%20setting&width=640&height=360&seq=vid-thumb-021&orientation=landscape',
  },

  // Kitchen Staff videos
  {
    id: 'vid-022',
    title: 'Kitchen Safety & Food Handling',
    veedUrl: 'https://www.veed.io/embed/example-022',
    designation: 'Kitchen Staff',
    sortOrder: 1,
    duration: '12:00',
    thumbnail: 'https://readdy.ai/api/search-image?query=Professional%20chef%20in%20clean%20modern%20commercial%20kitchen%20demonstrating%20food%20safety%20procedures%2C%20stainless%20steel%20surfaces%2C%20bright%20even%20lighting%2C%20organized%20professional%20kitchen%20environment&width=640&height=360&seq=vid-thumb-022&orientation=landscape',
  },
  {
    id: 'vid-023',
    title: 'Hygiene Standards in Food Service',
    veedUrl: 'https://www.veed.io/embed/example-023',
    designation: 'Kitchen Staff',
    sortOrder: 2,
    duration: '10:45',
    thumbnail: 'https://readdy.ai/api/search-image?query=Clean%20organized%20commercial%20kitchen%20with%20staff%20wearing%20proper%20hygiene%20gear%2C%20gloves%20and%20hair%20nets%2C%20bright%20sterile%20environment%2C%20professional%20food%20service%20setting%2C%20warm%20lighting&width=640&height=360&seq=vid-thumb-023&orientation=landscape',
  },
];