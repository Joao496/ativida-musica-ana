# Minha Playlist

Aplicativo de reprodução de músicas para a atividade de Expo AV.

## O projeto atende

- FlatList com 5 músicas
- Reprodução e pausa com expo-av
- Barra de progresso
- Temporizador
- Persistência com AsyncStorage
- Exclusão de músicas
- useEffect
- Parada do áudio ao sair para segundo plano
- Splash Screen e ícone configurados no app.json

## Instalação

No terminal, dentro da pasta do projeto:

```bash
npm install
npx expo start
```

## Logo

Coloque sua imagem de logo feita com IA em:

`assets/logo.png`

Depois, se necessário, reinicie o Expo para atualizar o ícone/Splash.

## Observação

As músicas deste projeto são carregadas por URLs de demonstração. Se uma URL externa não funcionar no momento do teste, troque a URL correspondente no arquivo `src/screens/PlaylistScreen.js`.
