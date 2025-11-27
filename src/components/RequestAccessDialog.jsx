import React, { useState } from 'react';
import { PendingUser, DecisionLog } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
  'aol.com', 'icloud.com', 'protonmail.com', 'tutanota.com'
];

export default function RequestAccessDialog({ open, onOpenChange, supportEmail }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    reason: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else {
      const domain = formData.email.split('@')[1].toLowerCase();
      if (FREE_EMAIL_DOMAINS.includes(domain)) {
        newErrors.email = 'Please use your company email address';
      }
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create pending user request
      await PendingUser.create({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        company: formData.company.trim(),
        reason: formData.reason.trim(),
        status: 'pending'
      });

      // Send notification to admins
      try {
        await SendEmail({
          to: supportEmail || 'admin@cabpoe.com',
          subject: 'New Access Request - CABPOE Console',
          body: `
New access request received:

Name: ${formData.name}
Email: ${formData.email}
Company: ${formData.company}
Reason: ${formData.reason || 'Not specified'}

Please review this request in the Admin Console under Settings > User Management > Pending Requests.
          `.trim()
        });
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError);
      }

      // Audit log
      await DecisionLog.create({
        decision_run_id: "access_request",
        level: "INFO", 
        message: `Access request submitted: ${formData.email} from ${formData.company}`,
        ts: new Date().toISOString()
      });

      toast({
        title: "Request Submitted",
        description: "Your access request has been sent to our team. You'll receive an email within one business day."
      });

      setFormData({ name: '', email: '', company: '', reason: '' });
      setErrors({});
      onOpenChange(false);

    } catch (error) {
      console.error('Request submission failed:', error);
      toast({
        title: "Submission Failed",
        description: "Unable to submit your request. Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Access</DialogTitle>
          <DialogDescription>
            Fill out this form to request access to CABPOE Console. Our team will review your request within one business day.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="req-name">Full Name *</Label>
            <Input id="req-name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={errors.name ? "border-red-500" : ""} />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="req-email">Work Email *</Label>
            <Input id="req-email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className={errors.email ? "border-red-500" : ""} />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            <p className="text-xs text-gray-500 mt-1">Please use your company email address</p>
          </div>

          <div>
            <Label htmlFor="req-company">Company *</Label>
            <Input id="req-company" value={formData.company} onChange={(e) => handleChange('company', e.target.value)} className={errors.company ? "border-red-500" : ""} />
            {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
          </div>

          <div>
            <Label htmlFor="req-reason">Reason for Access</Label>
            <Textarea id="req-reason" placeholder="Briefly describe why you need access (optional)" value={formData.reason} onChange={(e) => handleChange('reason', e.target.value)} className="h-20" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">{isSubmitting ? 'Submitting...' : 'Submit Request'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}