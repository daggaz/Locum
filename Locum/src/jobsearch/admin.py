import models
from django.contrib import admin

class NotificationAreaInline(admin.StackedInline):
    model = models.NotificationArea
    extra = 0
    
class ApplicationInline(admin.StackedInline):
    model = models.Application
    extra = 0

class ApplicantRatingInline(admin.StackedInline):
    model = models.ApplicantRating
    extra = 0

class ApplicantAdmin(admin.ModelAdmin):
    inlines = [
               NotificationAreaInline,
               ApplicationInline,
               ApplicantRatingInline,
               ]

class EmployerSiteInline(admin.StackedInline):
    model = models.EmployerSite
    extra = 0
    
class PositionInline(admin.StackedInline):
    model = models.Position
    extra = 0

class EmployerRatingInline(admin.StackedInline):
    model = models.EmployerRating
    extra = 0
    
class EmployerAdmin(admin.ModelAdmin):
    inlines = [
               EmployerSiteInline,
               EmployerRatingInline,
               ]

class ApplicationAdmin(admin.ModelAdmin):
    pass
    
class PositionAdmin(admin.ModelAdmin):
    inlines = [
               ApplicationInline,
               ]

admin.site.register(models.Applicant, admin_class=ApplicantAdmin)
admin.site.register(models.Application, admin_class=ApplicationAdmin)
admin.site.register(models.Employer, admin_class=EmployerAdmin)
admin.site.register(models.Position, admin_class=PositionAdmin)
