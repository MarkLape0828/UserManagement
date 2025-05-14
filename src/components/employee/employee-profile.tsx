import type { UserSession } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, UserCircle, Briefcase, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

interface EmployeeProfileProps {
  user: UserSession;
}

export function EmployeeProfile({ user }: EmployeeProfileProps) {
  const getInitials = (name: string) => {
    const names = name.split(' ');
    const initials = names.map((n) => n[0]).join('');
    return initials.toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <Card className="w-full max-w-2xl shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/80 to-accent/80 p-8 text-primary-foreground">
          <div className="flex items-center space-x-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
              {/* Placeholder for user image */}
              {/* <AvatarImage src="https://placehold.co/100x100.png" alt={user.name} /> */}
              <AvatarFallback className="text-3xl bg-background text-primary font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-4xl font-bold">{user.name}</CardTitle>
              <CardDescription className="text-lg text-primary-foreground/80">
                Your Personal Profile
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem icon={<UserCircle className="text-primary" />} label="Full Name" value={user.name} />
            <InfoItem icon={<Mail className="text-primary" />} label="Email Address" value={user.email} />
            <InfoItem icon={<Briefcase className="text-primary" />} label="Role" value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} isBadge={true} />
            <InfoItem icon={<ShieldCheck className="text-primary" />} label="Account Status" value="Active" isBadge={true} badgeVariant="secondary" />
          </div>

          <div className="mt-8 pt-6 border-t">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Profile Overview</h3>
            <p className="text-muted-foreground leading-relaxed">
              This is your personal dashboard where you can view your account details and manage your preferences. 
              For any changes or updates to your profile information, please contact an administrator or your HR department.
            </p>
          </div>
           <div className="flex justify-center items-center p-4 mt-4 rounded-lg bg-secondary/20">
            <Image 
              src="https://placehold.co/400x250.png" 
              alt="Employee working at desk"
              data-ai-hint="employee desk"
              width={400} 
              height={250} 
              className="rounded-md shadow-sm" 
            />
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-6 border-t">
            <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isBadge?: boolean;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

function InfoItem({ icon, label, value, isBadge = false, badgeVariant = "default" }: InfoItemProps) {
  return (
    <div className="flex items-start space-x-3 p-3 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors">
      <span className="flex-shrink-0 text-primary pt-1">{icon}</span>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {isBadge ? (
          <Badge variant={badgeVariant} className="mt-1 text-sm">{value}</Badge>
        ) : (
          <p className="text-lg font-semibold text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}
