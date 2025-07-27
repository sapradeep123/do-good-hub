import { MapPin, Users, Target } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NGOCardProps {
  id: string;
  name: string;
  description: string;
  location: string;
  category: string;
  imageUrl: string;
  totalRaised: number;
  donorsCount: number;
  isVerified?: boolean;
}

export const NGOCard = ({
  name,
  description,
  location,
  category,
  imageUrl,
  totalRaised,
  donorsCount,
  isVerified = false,
}: NGOCardProps) => {
  const formatAmount = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isVerified && (
          <Badge className="absolute top-3 right-3 bg-success text-success-foreground">
            Verified
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg leading-tight">{name}</h3>
          <Badge variant="secondary">{category}</Badge>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {location}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {description}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4 text-primary" />
            <span className="font-medium">{formatAmount(totalRaised)} raised</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{donorsCount} donors</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button className="w-full" variant="donate">
          View & Donate
        </Button>
      </CardFooter>
    </Card>
  );
};