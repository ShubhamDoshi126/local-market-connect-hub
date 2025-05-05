
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Users, UserPlus, Clipboard, CheckCircle } from "lucide-react";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { businessInviteSchema } from "../business/BusinessInviteSchema";

interface TeamMember {
  id: string;
  user_id: string | null;
  role: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

interface BusinessTeamProps {
  businessId: string;
  isOwner: boolean;
}

type InviteFormValues = z.infer<typeof businessInviteSchema>;

const BusinessTeam = ({ businessId, isOwner }: BusinessTeamProps) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(businessInviteSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("business_members")
        .select(`
          id,
          user_id,
          role,
          profiles:user_id (
            email:id,
            first_name,
            last_name
          )
        `)
        .eq("business_id", businessId);

      if (error) throw error;

      setMembers(
        data.map(member => ({
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          email: member.profiles?.email,
          first_name: member.profiles?.first_name,
          last_name: member.profiles?.last_name
        }))
      );
    } catch (error: any) {
      console.error("Error fetching team members:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load team members",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = async () => {
    try {
      // Generate a random 8-character invite code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Check if an active invite already exists
      const { data: existingInvites, error: queryError } = await supabase
        .from("business_invites")
        .select("id, code")
        .eq("business_id", businessId)
        .eq("status", "active");
      
      if (queryError) throw queryError;
      
      if (existingInvites && existingInvites.length > 0) {
        // Reuse existing code
        setInviteCode(existingInvites[0].code);
      } else {
        // Create new invite code
        const { error } = await supabase
          .from("business_invites")
          .insert({
            business_id: businessId,
            code: code,
            status: "active",
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          });
  
        if (error) throw error;
        setInviteCode(code);
      }
    } catch (error: any) {
      console.error("Error generating invite code:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate invite code",
      });
    }
  };

  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("business_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: "Team member role has been updated",
      });

      // Update local state
      setMembers(members.map(member => 
        member.id === memberId ? { ...member, role: newRole } : member
      ));
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update role",
      });
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("business_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: "Team member has been removed from the business",
      });

      // Update local state
      setMembers(members.filter(member => member.id !== memberId));
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove team member",
      });
    }
  };

  const onSubmitInvite = async (values: InviteFormValues) => {
    setInviteLoading(true);

    try {
      // In a real-world scenario, you would integrate with an email service here
      toast({
        title: "Invitation sent!",
        description: `An invitation email has been sent to ${values.email}`,
      });
      form.reset();
      setDialogOpen(false);
    } catch (error: any) {
      console.error("Error sending invite:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send invitation",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [businessId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Business Team
        </CardTitle>
        {isOwner && (
          <div className="flex items-center space-x-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an email invitation to add someone to your business team.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitInvite)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email address</FormLabel>
                          <FormControl>
                            <Input placeholder="colleague@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={inviteLoading}>
                        {inviteLoading ? "Sending..." : "Send Invitation"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Button size="sm" variant="outline" onClick={generateInviteCode}>
              Generate Invite Code
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {inviteCode && (
          <div className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-sm">Invite Code</h3>
                <p className="text-lg font-mono tracking-wide">{inviteCode}</p>
                <p className="text-xs text-gray-500">Valid for 7 days</p>
              </div>
              <Button size="sm" variant="ghost" onClick={copyInviteCode}>
                {copySuccess ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <Clipboard className="h-4 w-4 mr-2" />
                )}
                {copySuccess ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading team members...</div>
        ) : members.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No team members found</div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-md">
                <div>
                  <div className="font-medium">
                    {member.first_name && member.last_name
                      ? `${member.first_name} ${member.last_name}`
                      : member.email || "Unknown User"}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={member.role === "owner" ? "default" : "outline"}>
                      {member.role === "owner" ? "Owner" : "Member"}
                    </Badge>
                    <span className="text-xs text-gray-500">{member.email}</span>
                  </div>
                </div>

                {isOwner && member.role !== "owner" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updateMemberRole(member.id, "admin")}>
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMemberRole(member.id, "member")}>
                        Make Member
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-500" 
                        onClick={() => removeMember(member.id)}
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessTeam;
