import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  AppState
} from 'react-native';

import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@MinhaPlaylist:faixas';

const PLAYLIST_INICIAL = [
  {
    id: '1',
    title: 'Música 1 - Escola é linda',
    url: require('../../assets/escola.mp3'),
  },
  {
    id: '2',
    title: 'Música 2 - Essa é pedrada',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: '3',
    title: 'Música 3 - Desconfie de quem não gosta',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: '4',
    title: 'Música 4 - Cuida do Pet (Official)',
    url: require('../../assets/musica.mp3'),
  },
  {
    id: '5',
    title: 'Música 5 - Para ouvir sempre',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
];

export default function PlaylistScreen() {
  const [playlist, setPlaylist] = useState(PLAYLIST_INICIAL);
  const [sound, setSound] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    carregarPlaylist();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        pararMusica();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [sound]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  async function carregarPlaylist() {
    try {
      const dadosSalvos = await AsyncStorage.getItem(STORAGE_KEY);

      if (dadosSalvos !== null) {
        const idsSalvos = JSON.parse(dadosSalvos);

        const playlistSalva = PLAYLIST_INICIAL.filter((musica) =>
          idsSalvos.includes(musica.id)
        );

        setPlaylist(playlistSalva);
      } else {
        const idsIniciais = PLAYLIST_INICIAL.map((musica) => musica.id);

        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(idsIniciais)
        );
      }
    } catch (error) {
      console.error('Erro ao carregar playlist:', error);
    }
  }

  async function salvarPlaylist(novaPlaylist) {
    try {
      const ids = novaPlaylist.map((musica) => musica.id);

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(ids)
      );
    } catch (error) {
      console.error('Erro ao salvar playlist:', error);
    }
  }

  const formatTime = (millis) => {
    if (!millis) {
      return '00:00';
    }

    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  async function handlePlaySong(item) {
    if (playingId === item.id) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }

      return;
    }

    if (sound) {
      await sound.unloadAsync();
      setPosition(0);
      setDuration(0);
    }

    try {
      console.log(`Carregando: ${item.title}`);

      const { sound: newSound } = await Audio.Sound.createAsync(
        item.url,
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingId(item.id);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis);

          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
          }
        }
      });
    } catch (error) {
      console.error('Erro ao carregar música:', error);

      Alert.alert(
        'Erro',
        'Não foi possível carregar essa música.'
      );
    }
  }

  async function pararMusica() {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();

        setSound(null);
        setPlayingId(null);
        setIsPlaying(false);
        setPosition(0);
        setDuration(0);
      }
    } catch (error) {
      console.error('Erro ao parar música:', error);
    }
  }

  function excluirMusica(id) {
    Alert.alert(
      'Excluir música',
      'Deseja excluir esta música da playlist?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            if (playingId === id) {
              await pararMusica();
            }

            const novaPlaylist = playlist.filter(
              (musica) => musica.id !== id
            );

            setPlaylist(novaPlaylist);
            await salvarPlaylist(novaPlaylist);
          }
        }
      ]
    );
  }

  const renderSong = ({ item }) => {
    const isActive = playingId === item.id;

    const progressPercentage =
      isActive && duration > 0
        ? (position / duration) * 100
        : 0;

    return (
      <View
        style={[
          styles.songCard,
          isActive && styles.activeCard
        ]}
      >
        <View style={styles.songHeader}>
          <Text
            style={[
              styles.songTitle,
              isActive && styles.activeText
            ]}
          >
            {item.title}
          </Text>

          <TouchableOpacity
            style={[
              styles.playButton,
              isActive && isPlaying
                ? styles.pauseButton
                : null
            ]}
            onPress={() => handlePlaySong(item)}
          >
            <Text style={styles.playButtonText}>
              {isActive && isPlaying ? '⏸️' : '▶️'}
            </Text>
          </TouchableOpacity>
        </View>

        {isActive && (
          <View style={styles.playerUI}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercentage}%`
                  }
                ]}
              />
            </View>

            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>
                {formatTime(position)}
              </Text>

              <Text style={styles.timeText}>
                {formatTime(duration)}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => excluirMusica(item.id)}
        >
          <Text style={styles.deleteText}>
            🗑️ Excluir
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>
        Minha Playlist 🎸🎶🎤
      </Text>

      <Text style={styles.headerSubtitle}>
        Minhas músicas favoritas
      </Text>

      <FlatList
        data={playlist}
        keyExtractor={(item) => item.id}
        renderItem={renderSong}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nenhuma música na playlist.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3f74a8',
    paddingTop: 50,
    paddingHorizontal: 20,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f5f6fb',
    marginBottom: 5,
  },

  headerSubtitle: {
    fontSize: 16,
    color: '#dbeafe',
    marginBottom: 20,
  },

  songCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  activeCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },

  songHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },

  activeText: {
    color: '#1D4ED8',
  },

  playButton: {
    backgroundColor: '#3bf63b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10,
  },

  pauseButton: {
    backgroundColor: '#EF4444',
  },

  playButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  playerUI: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderColor: '#DBEAFE',
  },

  progressBarBackground: {
    height: 6,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },

  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  timeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  deleteButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },

  deleteText: {
    color: '#EF4444',
    fontWeight: 'bold',
  },

  emptyText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 17,
  },
});