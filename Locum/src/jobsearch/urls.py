from django.conf.urls import patterns, url

urlpatterns = patterns('jobsearch.views',
    #url(r'^$', 'home', name='home'),
    
    # Positions
    url(r'^positions/$', 'positions', name='positions'),
    url(r'^positions/search/$', 'search', name='search'),
    url(r'^positions/post/$', 'post_position', name='post_position'),
    url(r'^positions/(?P<position_id>[0-9]+)/$', 'view_position', name='view_position'),
    url(r'^positions/(?P<position_id>[0-9]+)/edit/$', 'edit_position', name='edit_position'),
    url(r'^positions/(?P<position_id>[0-9]+)/apply/$', 'apply_for_position', name='apply_for_position'),
    url(r'^positions/(?P<position_id>[0-9]+)/applications/$', 'view_applications_for_position', name='view_applications_for_position'),
    url(r'^positions/(?P<position_id>[0-9]+)/applications/(?P<application_id>[0-9]+)/$', 'view_application', name='view_application'),
    url(r'^positions/(?P<position_id>[0-9]+)/applications/(?P<application_id>[0-9]+)/edit/$', 'edit_application', name='edit_application'),
    url(r'^positions/(?P<position_id>[0-9]+)/contract/$', 'view_contract', name='view_contract'),
    
    url(r'^applications/$', 'applications', name='applications'),    
    
    url(r'^profile/(?P<username>[^/]+)/$', 'profile', name='profile'),
    url(r'^accounts/edit-profile/$', 'edit_profile', name='edit_profile'),
)
