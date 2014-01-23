from django.shortcuts import render_to_response
from models import Position
from django.contrib.auth.decorators import user_passes_test, login_required
from jobsearch.models import Employer, Applicant
from django.core.paginator import Paginator
from django.contrib.auth.models import User

@login_required
def positions(request):
    page = request.GET.get('page', 1)
    positions_per_page = 10
    positions = Position.objects.filter()
    paginator = Paginator(positions, positions_per_page)
    positions = paginator.page(page)
    print(positions[0].get_absolute_url())
    context = {
               'positions': positions,
               }
    
    return render_to_response('jobsearch/positions.html', context)

@login_required
def view_position(request, position_id):
    position = Position.objects.get(pk=position_id)
    context = {
               'position': position,
               }
    
    return render_to_response('jobsearch/view_position.html', context)

@user_passes_test(Employer.user_is_employer)
def post_position(request):
    context = {}
    
    return render_to_response('jobsearch/post_position.html', context)

@user_passes_test(Employer.user_is_employer)
def edit_position(request, position_id):
    position = Position.objects.get(pk=position_id)
    if position.site.employer == request.user.employer:
        context = {
                   'position': position,
                   }
        
        return render_to_response('jobsearch/edit_position.html', context)
    else:
        return render_to_response('jobsearch/permission_denied.html', context)

@user_passes_test(Employer.user_is_employer)
def view_applications_for_position(request, position_id):
    position = Position.objects.get(pk=position_id)
    if position.site.employer.user == request.user:
        context = {
                   'position': position,
                   'applications': position.applications.all(),
                   }
        
        return render_to_response('jobsearch/applications_for_position.html', context)
    else:
        return render_to_response('jobsearch/permission_denied.html', context)

@user_passes_test(Applicant.user_is_applicant)
def apply_for_position(request, position_id):
    position = Position.objects.get(pk=position_id)
    context = {
               'position': position,
               }
    
    return render_to_response('jobsearch/apply_for_position.html', context)

@user_passes_test(Applicant.user_is_applicant)
def edit_application(request, position_id, application_id):
    position = Position.objects.get(pk=position_id)
    application = position.applications.get(pk=application_id)
    if application.applicant.user == request.user:
        context = {
                   'position': position,
                   'application': application,
                   }
        
        return render_to_response('jobsearch/apply_for_position.html', context)
    else:
        return render_to_response('jobsearch/permission_denied.html', context)

@login_required
def view_application(request, position_id, application_id):
    position = Position.objects.get(pk=position_id)
    application = position.applications.get(pk=application_id)
    if application.applicant.user == request.user or application.position.site.employer.user == request.user:
        context = {
                   'position': position,
                   'application': application,
                   }
        
        return render_to_response('jobsearch/view_application.html', context)
    else:
        return render_to_response('jobsearch/permission_denied.html', context)

@login_required
def edit_profile(request):
    pass

@login_required
def profile(request, username):
    user = User.objects.get(username=username)
    if Employer.user_is_employer(user):
        employer = user.employer
        context = {
                   'employer': employer,
                   'positions': Position.objects.filter(site__employer__pk=employer.pk),
                   }
        return render_to_response('jobsearch/employer_profile.html', context)
    
    elif Applicant.user_is_applicant(user):
        applicant = user.applicant
        context = {
                   'applicant': applicant,
                   }
        return render_to_response('jobsearch/applicant_profile.html', context)

@login_required
def applications(request):
    pass

@login_required
def view_contract(request, position_id):
    pass

@login_required
def search(request):
    pass
