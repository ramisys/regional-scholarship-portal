import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm, useFieldArray } from 'react-hook-form';
import api, { handleApiError } from '../../utils/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Trash2, Save } from 'lucide-react';

interface ApplicationFormData {
  personalInfo: {
    firstName: string;
    middleName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    address: string;
    city: string;
    region: string;
    postalCode: string;
  };
  educationalBackground: Array<{
    schoolName: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
    gpa: string;
  }>;
}

export const ApplicationForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  const { register, control, handleSubmit, formState: { errors } } = useForm<ApplicationFormData>({
    defaultValues: {
      educationalBackground: [{ schoolName: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'educationalBackground'
  });

  const onSubmit = async (data: ApplicationFormData) => {
    setIsLoading(true);
    try {
      await api.post('/student/applications', data);
      toast.success('Application submitted successfully!');
      navigate('/student/applications');
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const saveDraft = async () => {
    setIsLoading(true);
    try {
      const formData = control._formValues;
      await api.post('/student/applications/draft', formData);
      toast.success('Draft saved successfully!');
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Scholarship Application</h1>
        <p className="text-gray-600 mt-1">Complete all sections to submit your application</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Enter your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      {...register('personalInfo.firstName', { required: 'First name is required' })}
                      className="mt-1"
                    />
                    {errors.personalInfo?.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.personalInfo.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input id="middleName" {...register('personalInfo.middleName')} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      {...register('personalInfo.lastName', { required: 'Last name is required' })}
                      className="mt-1"
                    />
                    {errors.personalInfo?.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.personalInfo.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      {...register('personalInfo.dateOfBirth', { required: 'Date of birth is required' })}
                      className="mt-1"
                    />
                    {errors.personalInfo?.dateOfBirth && (
                      <p className="text-red-500 text-sm mt-1">{errors.personalInfo.dateOfBirth.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Input
                      id="gender"
                      {...register('personalInfo.gender', { required: 'Gender is required' })}
                      className="mt-1"
                    />
                    {errors.personalInfo?.gender && (
                      <p className="text-red-500 text-sm mt-1">{errors.personalInfo.gender.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>How can we reach you?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('contactInfo.email', { required: 'Email is required' })}
                      className="mt-1"
                    />
                    {errors.contactInfo?.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.contactInfo.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register('contactInfo.phone', { required: 'Phone is required' })}
                      className="mt-1"
                    />
                    {errors.contactInfo?.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.contactInfo.phone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Textarea
                    id="address"
                    {...register('contactInfo.address', { required: 'Address is required' })}
                    className="mt-1"
                  />
                  {errors.contactInfo?.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.contactInfo.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...register('contactInfo.city', { required: 'City is required' })}
                      className="mt-1"
                    />
                    {errors.contactInfo?.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.contactInfo.city.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      {...register('contactInfo.region', { required: 'Region is required' })}
                      className="mt-1"
                    />
                    {errors.contactInfo?.region && (
                      <p className="text-red-500 text-sm mt-1">{errors.contactInfo.region.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      {...register('contactInfo.postalCode', { required: 'Postal code is required' })}
                      className="mt-1"
                    />
                    {errors.contactInfo?.postalCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.contactInfo.postalCode.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education">
            <Card>
              <CardHeader>
                <CardTitle>Educational Background</CardTitle>
                <CardDescription>Add your educational history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">School {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>School Name</Label>
                        <Input
                          {...register(`educationalBackground.${index}.schoolName`, { required: true })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Degree</Label>
                        <Input
                          {...register(`educationalBackground.${index}.degree`, { required: true })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Field of Study</Label>
                        <Input
                          {...register(`educationalBackground.${index}.fieldOfStudy`, { required: true })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>GPA</Label>
                        <Input
                          {...register(`educationalBackground.${index}.gpa`, { required: true })}
                          className="mt-1"
                          placeholder="4.0"
                        />
                      </div>
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          {...register(`educationalBackground.${index}.startDate`, { required: true })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          {...register(`educationalBackground.${index}.endDate`)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ schoolName: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '' })}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another School
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" onClick={saveDraft} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </div>
  );
};
