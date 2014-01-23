from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^', include('jobsearch.urls')),
    url(r'^accounts/', include('django.contrib.auth.urls')),

    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    url(r'^django-admin/', include(admin.site.urls)),
    url(r'^admin/', include('jamie.admin.urls')),
    )
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += patterns('',
    (r'^', include('jamie.content.urls')),
    (r'^(?P<path>.*)$', 'jamie.content.dispatch.dispatch'),
    )

from jamie.content.models import Page
sitemap_urlpatterns = {
    Page: patterns('', (r'^', include('jamie.content.pages.urls'))),
    }
