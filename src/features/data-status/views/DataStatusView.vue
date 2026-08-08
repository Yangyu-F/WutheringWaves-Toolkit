<template>
  <div class="status-page">
    <p class="eyebrow">{{ $t('data.eyebrow') }}</p>
    <h1>{{ $t('data.title') }}</h1>
    <p class="hero-intro">{{ $t('data.intro') }}</p>
    <dl class="status-list">
      <div>
        <dt>{{ $t('data.primary') }}</dt>
        <dd>{{ $t('data.primaryValue') }}</dd>
      </div>
      <div>
        <dt>{{ $t('data.scope') }}</dt>
        <dd>{{ $t('data.scopeValue') }}</dd>
      </div>
      <div>
        <dt>{{ $t('data.policy') }}</dt>
        <dd>{{ $t('data.policyValue') }}</dd>
      </div>
    </dl>
    <RouterLink to="/" class="text-link">← {{ $t('data.back') }}</RouterLink>
  </div>
</template>
