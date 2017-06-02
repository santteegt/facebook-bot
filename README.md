# facebook-bot
Naive implementation of a chat bot for facebook


## Configuring Greeting message

```
curl -X POST -H "Content-Type: application/json" -d '{"setting_type":"greeting", "greeting":{ "text":"Hola {{user_firs aqui para ayudarte a detectar noticias y perfiles no confiables. Pero también necesito tu ayuda!" } }' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=ACCESS_TOKEN"  
```

