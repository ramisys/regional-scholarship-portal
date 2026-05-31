import React, { useState, useEffect } from 'react';
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
import { ButtonLoader, PageLoader, SkeletonForm } from '../../components/loading';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const stepOrder = ['personal', 'contact', 'education'];

  const { register, control, handleSubmit, getValues, reset, formState: { errors } } = useForm<ApplicationFormData>({
    defaultValues: {
      educationalBackground: [{ schoolName: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'educationalBackground'
  });

  const isBusy = isSubmitting || isSavingDraft;

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    try {
      await api.post('/student/applications', data);
      // remove any local draft after successful submit
      try { localStorage.removeItem('application_draft'); } catch (e) {}
      toast.success('Application submitted successfully!');
      navigate('/student/applications');
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const DRAFT_KEY = 'application_draft';

  useEffect(() => {
    const loadDraft = async () => {
      // Prefer server-saved draft, fall back to localStorage
      try {
        const response = await api.get('/student/applications');
        const apps = response.data?.data ?? [];
        // find latest draft for this user
        const draftApp = Array.isArray(apps) ? apps.find((a: any) => a.is_draft) : null;
        if (draftApp) {
          // try to map server shape to form shape
          const mapped: any = {
            personalInfo: {},
            contactInfo: {},
            educationalBackground: [],
          };

          if (draftApp.personal_statement) {
            try {
              const parsed = JSON.parse(draftApp.personal_statement);
              if (parsed.personalInfo && typeof parsed.personalInfo === 'object') {
                mapped.personalInfo = parsed.personalInfo;
              }
              if (parsed.contactInfo && typeof parsed.contactInfo === 'object') {
                mapped.contactInfo = parsed.contactInfo;
              }
            } catch (e) {
              // ignore parse errors
            }
          }

          if (Array.isArray(draftApp.educational_backgrounds)) {
            mapped.educationalBackground = draftApp.educational_backgrounds.map((eb: any) => ({
              schoolName: eb.school_name || '',
              degree: eb.level || '',
              fieldOfStudy: '',
              startDate: eb.year_started ? `${String(eb.year_started)}-01-01` : '',
              endDate: eb.year_ended ? `${String(eb.year_ended)}-01-01` : '',
              gpa: '',
            }));
          }

          reset(mapped);
          toast('Loaded saved draft from server');
          setIsLoadingDraft(false);
          return;
        }
      } catch (err) {
        // ignore and fallback to local
      }

      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          reset(parsed);
          toast('Loaded saved draft from this device');
        } catch (e) {
          // ignore parse errors
        }
      }

      setIsLoadingDraft(false);
    };

    void loadDraft();
  }, [reset]);

  const saveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const formData = getValues();

      // Attempt to persist draft to server
      try {
        await api.post('/student/applications/draft', formData);
        toast.success('Draft saved to server');
      } catch (err) {
        // fallback to localStorage if server save fails
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
          toast.success('Draft saved to this device (offline)');
        } catch (e) {
          toast.error('Failed to save draft');
        }
      }
    } catch (err) {
      toast.error('Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const currentStepIndex = stepOrder.indexOf(activeTab);
  const isFinalStep = activeTab === 'education';

  const goToNextStep = () => {
    const nextStep = stepOrder[currentStepIndex + 1];
    if (nextStep) {
      setActiveTab(nextStep);
    }
  };

  const goToPreviousStep = () => {
    const previousStep = stepOrder[currentStepIndex - 1];
    if (previousStep) {
      setActiveTab(previousStep);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="mb-1 text-gray-900 text-2xl font-semibold">Scholarship Application</h1>
        <p className="text-gray-500">Complete all sections to submit your application</p>
      </div>

      <ProgressIndicator
        currentStep={currentStepIndex}
        steps={[
          { label: 'Personal Info' },
          { label: 'Contact Info' },
          { label: 'Education' },
        ]}
      />

      {isLoadingDraft ? (
        <PageLoader title="Loading application draft" description="Restoring your saved progress">
          <SkeletonForm fields={5} />
        </PageLoader>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset disabled={isBusy} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="contact">Contact Info</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader className="border-b">
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
              <CardHeader className="border-b">
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
              <CardHeader className="border-b">
                <CardTitle>Educational Background</CardTitle>
                <CardDescription>Add your educational history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-4">
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

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={saveDraft} disabled={isBusy}>
              <ButtonLoader isLoading={isSavingDraft} loadingLabel="Saving...">
                <span className="inline-flex items-center">
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </span>
              </ButtonLoader>
            </Button>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {currentStepIndex > 0 && (
                <Button type="button" variant="outline" onClick={goToPreviousStep} disabled={isBusy}>
                  Back
                </Button>
              )}

              {isFinalStep ? (
                <Button type="submit" disabled={isBusy}>
                  <ButtonLoader isLoading={isSubmitting} loadingLabel="Submitting...">
                    Submit Application
                  </ButtonLoader>
                </Button>
              ) : (
                <Button type="button" onClick={goToNextStep} disabled={isBusy}>
                  Next
                </Button>
              )}
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  );
};
