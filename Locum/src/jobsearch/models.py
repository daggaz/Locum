from django.db import models
from django.contrib.auth.models import User

class Applicant(models.Model):
    user = models.OneToOneField(User, related_name='applicant')
    notifyByEmail = models.BooleanField()
    notifyByText = models.BooleanField()
    shortlisted_positions = models.ManyToManyField('Position', related_name='shortlisted_by', blank=True)
    
    @staticmethod
    def user_is_applicant(user):
        if hasattr(user, 'applicant'):
            return not user.applicant is None
        return False
    
    def get_absolute_url(self):
        from django.core.urlresolvers import reverse
        return reverse('profile', kwargs={'username': self.user.username})
    
class NotificationArea(models.Model):
    applicant = models.ForeignKey(Applicant, related_name='notification_areas')
    latitude = models.FloatField()
    longitude = models.FloatField()
    radius = models.FloatField()
    
class Employer(models.Model):
    user = models.OneToOneField(User, related_name='employer')
    
    @staticmethod
    def user_is_employer(user):
        if hasattr(user, 'employer'):
            return not user.employer is None
        return False

class EmployerSite(models.Model):
    employer = models.ForeignKey(Employer, related_name='sites')
    email = models.CharField(max_length=255)
    phone = models.CharField(max_length=255)
    fax = models.CharField(max_length=255, blank=True)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    postcode = models.CharField(max_length=20)
    latitude = models.FloatField()
    longitude = models.FloatField()

class Position(models.Model):
    STATUS_CHOICES = (
        'Draft',
        'Active',
        'Closed',
        'Withdrawn',
        )
    title = models.CharField(max_length=1024)
    description = models.TextField()
    site = models.ForeignKey(EmployerSite, related_name='positions')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=255, choices=zip(STATUS_CHOICES,STATUS_CHOICES))
    
    def get_absolute_url(self):
        from django.core.urlresolvers import reverse
        return reverse('view_position', kwargs={'position_id':self.pk})

class Notification(models.Model):
    applicant = models.ForeignKey(Applicant, related_name='notifications')
    position = models.ForeignKey(Position, related_name='notifications')
    created = models.DateTimeField(auto_now_add=True)
    
class Application(models.Model):
    applicant = models.ForeignKey(Applicant, related_name='applications')
    position = models.ForeignKey(Position, related_name='applications')
    covering_note = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    
    @property
    def state(self):
        if hasattr(self, '_unsaved_state'):
            return self._unsaved_state
        return self.states.order_by('-created')[0]
    
    @state.setter
    def state(self, state):
        if state in ApplicationState.STATUS_CHOICES:
            self._unsaved_state = state
        else:
            raise Exception("invalid state")
        
    def save(self, *args, **kwargs):
        super(Application, self).save(*args, **kwargs)
        if hasattr(self, '_unsaved_state'):
            state = ApplicationState()
            state.application = self
            state.status = self._unsaved_state
            state.save()
    
    def get_absolute_url(self):
        from django.core.urlresolvers import reverse
        return reverse('view_application', kwargs={'position_id':self.position.pk, 'application_id':self.pk})

class ApplicationState(models.Model):
    STATUS_CHOICES = (
        'Draft',
        'Pending',
        'Offered',
        'Accepted',
        'RejectedByEmployer',
        'RejectedByApplicant',
        )
    
    application = models.ForeignKey(Application, related_name='states')
    created = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=255, choices=zip(STATUS_CHOICES,STATUS_CHOICES))

class EmployerRating(models.Model):
    user = models.ForeignKey(Employer, related_name='ratings')
    rated_by = models.ForeignKey(Applicant, related_name='ratings_given')
    position = models.ForeignKey(Position)
    rating = models.IntegerField()
    comment = models.TextField()

class ApplicantRating(models.Model):
    user = models.ForeignKey(Applicant, related_name='ratings')
    rated_by = models.ForeignKey(Employer, related_name='ratings_given')
    position = models.ForeignKey(Position)
    rating = models.IntegerField()
    comment = models.TextField()
