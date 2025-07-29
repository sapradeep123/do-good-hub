export interface NGO {
  id: string;
  name: string;
  description: string;
  story: string;
  aboutUs: string;
  location: string;
  category: string;
  imageUrl: string;
  totalRaised: number;
  donorsCount: number;
  isVerified: boolean;
  packages: DonationPackage[];
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
}

export interface DonationPackage {
  id: string;
  title: string;
  description: string;
  amount: number;
  impact: string;
  imageUrl?: string;
}

export const mockNGOs: NGO[] = [
  {
    id: "1",
    name: "Smile Foundation",
    description: "Empowering underprivileged children through education and healthcare initiatives across India.",
    story: "Founded in 2002, Smile Foundation has been working tirelessly to break the cycle of poverty through education. Our journey began with a simple belief - every child deserves a chance to dream and achieve their potential.",
    aboutUs: "We are a national development organization directly benefiting over 1.5 million children and families every year. Our focus areas include education, healthcare, livelihood, and women empowerment.",
    location: "New Delhi, India",
    category: "Education",
    imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400",
    totalRaised: 2500000,
    donorsCount: 1250,
    isVerified: true,
    packages: [
      {
        id: "p1",
        title: "School Supplies Kit",
        description: "Provide a complete school supplies kit for one child",
        amount: 1500,
        impact: "Covers books, stationery, and school bag for one year"
      },
      {
        id: "p2",
        title: "Monthly Meals",
        description: "Sponsor nutritious meals for a child for one month",
        amount: 800,
        impact: "22 nutritious meals for one child"
      },
      {
        id: "p3",
        title: "Education Sponsorship",
        description: "Full education sponsorship for one child for one year",
        amount: 12000,
        impact: "Complete education including fees, books, and uniform"
      }
    ],
    contact: {
      email: "contact@smilefoundation.org",
      phone: "+91-11-43123456",
      website: "https://smilefoundation.org"
    }
  },
  {
    id: "2",
    name: "Teach for India",
    description: "Developing leaders who expand educational opportunity for children across India.",
    story: "Teach for India was founded in 2009 with a vision to eliminate educational inequity in India. We recruit and develop young leaders to teach in low-income schools.",
    aboutUs: "We are part of the global Teach for All network. Our Fellows commit to teaching for two years while developing leadership skills that will serve them throughout their careers.",
    location: "Mumbai, Maharashtra",
    category: "Education",
    imageUrl: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=400",
    totalRaised: 1800000,
    donorsCount: 890,
    isVerified: true,
    packages: [
      {
        id: "p4",
        title: "Teacher Training",
        description: "Support training for one teacher for a month",
        amount: 3000,
        impact: "Professional development for quality education"
      },
      {
        id: "p5",
        title: "Classroom Resources",
        description: "Equip a classroom with learning materials",
        amount: 5000,
        impact: "Learning materials for 40 students"
      },
      {
        id: "p6",
        title: "Digital Learning Tools",
        description: "Provide tablets and digital content for students",
        amount: 15000,
        impact: "Digital learning access for entire classroom"
      }
    ],
    contact: {
      email: "info@teachforindia.org",
      phone: "+91-22-67584321",
      website: "https://teachforindia.org"
    }
  },
  {
    id: "3",
    name: "Akshaya Patra Foundation",
    description: "Implementing the world's largest school meal programme, feeding over 1.8 million children daily.",
    story: "Started in 2000 with serving 1,500 children, Akshaya Patra has grown to serve nutritious meals to millions of children across India, supporting their education and nutrition.",
    aboutUs: "We are committed to eliminating classroom hunger and bringing children to school. Our kitchen-on-wheels and centralized kitchens ensure fresh, hot meals reach children daily.",
    location: "Bangalore, Karnataka",
    category: "Nutrition",
    imageUrl: "https://images.unsplash.com/photo-1594736797933-d0400b91b47a?w=400",
    totalRaised: 3200000,
    donorsCount: 2100,
    isVerified: true,
    packages: [
      {
        id: "p7",
        title: "Daily Meal",
        description: "Sponsor one nutritious meal for a child",
        amount: 15,
        impact: "One hot, nutritious meal for a school child"
      },
      {
        id: "p8",
        title: "Monthly Nutrition",
        description: "Provide daily meals for a child for one month",
        amount: 350,
        impact: "22 school days of nutritious meals"
      },
      {
        id: "p9",
        title: "Annual Food Support",
        description: "Complete nutrition support for a child for one year",
        amount: 3500,
        impact: "200+ nutritious meals throughout the school year"
      }
    ],
    contact: {
      email: "info@akshayapatra.org",
      phone: "+91-80-25432516",
      website: "https://akshayapatra.org"
    }
  }
];