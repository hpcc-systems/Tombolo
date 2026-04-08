{{- define "tombolo.namespace" -}}
{{- .Values.namespace.name -}}
{{- end -}}

{{- define "tombolo.name" -}}
tombolo
{{- end -}}

{{- define "tombolo.requireNonEmpty" -}}
{{- $value := index . 0 -}}
{{- $path := index . 1 -}}
{{- if eq (trim (toString $value)) "" -}}
{{- fail (printf "Missing required value: %s. Provide it via values-secrets.local.yaml or another override file." $path) -}}
{{- end -}}
{{- end -}}

{{- define "tombolo.validateRequiredSecrets" -}}
{{- include "tombolo.requireNonEmpty" (list .Values.server.secret.JWT_SECRET "server.secret.JWT_SECRET") -}}
{{- include "tombolo.requireNonEmpty" (list .Values.server.secret.JWT_REFRESH_SECRET "server.secret.JWT_REFRESH_SECRET") -}}
{{- include "tombolo.requireNonEmpty" (list .Values.server.secret.CSRF_SECRET "server.secret.CSRF_SECRET") -}}
{{- include "tombolo.requireNonEmpty" (list .Values.server.secret.ENCRYPTION_KEY "server.secret.ENCRYPTION_KEY") -}}
{{- include "tombolo.requireNonEmpty" (list .Values.server.secret.JOBS_API_KEY "server.secret.JOBS_API_KEY") -}}
{{- include "tombolo.requireNonEmpty" (list .Values.jobs.secret.JOBS_API_KEY "jobs.secret.JOBS_API_KEY") -}}
{{- include "tombolo.requireNonEmpty" (list .Values.runtime.secret.DB_USERNAME "runtime.secret.DB_USERNAME") -}}
{{- include "tombolo.requireNonEmpty" (list .Values.runtime.secret.DB_PASSWORD "runtime.secret.DB_PASSWORD") -}}
{{- include "tombolo.requireNonEmpty" (list .Values.runtime.secret.REDIS_PASSWORD "runtime.secret.REDIS_PASSWORD") -}}
{{- end -}}
