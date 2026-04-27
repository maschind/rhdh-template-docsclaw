{{/*
Expand the name of the chart.
*/}}
{{- define "docsclaw-template.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "docsclaw-template.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "docsclaw-template.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "docsclaw-template.labels" -}}
helm.sh/chart: {{ include "docsclaw-template.chart" . }}
app.openshift.io/runtime: golang
{{ include "docsclaw-template.selectorLabels" . }}
{{ include "backstage.labels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Backstage labels
*/}}
{{- define "backstage.labels" -}}
backstage.io/kubernetes-id: {{ include "docsclaw-template.name" .}}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "docsclaw-template.selectorLabels" -}}
app.kubernetes.io/name: {{ include "docsclaw-template.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "docsclaw-template.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "docsclaw-template.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{- define "docsclaw-template.image" -}}
{{- if eq .Values.image.registry "Quay" }}
{{- printf "%s/%s/%s:%s" .Values.image.host .Values.image.organization .Values.image.name .Values.image.tag -}}
{{- else }}
{{- printf "%s/%s/%s:latest" .Values.image.host .Values.image.namespace .Values.image.name -}}
{{- end }}
{{- end }}

{{- define "docsclaw-template.chatUI.selectorLabels" -}}
app.kubernetes.io/name: {{ include "docsclaw-template.name" . }}-chat
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "docsclaw-template.chatUI.image" -}}
{{- if eq .Values.chatUI.image.registry "Quay" }}
{{- printf "%s/%s/%s:%s" .Values.chatUI.image.host .Values.chatUI.image.organization .Values.chatUI.image.name .Values.chatUI.image.tag -}}
{{- else }}
{{- printf "%s/%s/%s:latest" .Values.chatUI.image.host .Values.chatUI.image.namespace .Values.chatUI.image.name -}}
{{- end }}
{{- end }}

{{- define "quay.auth" -}}
{{- $auth:= printf "%s:%s" .Values.image.organization .Values.image.password -}}
{{- $auth | b64enc -}}
{{- end }}
