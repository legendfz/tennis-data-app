import { Share, Platform } from 'react-native';

export interface SharePlayerData {
  name: string;
  ranking: number;
  grandSlams: number;
  titles: number;
}

export interface ShareMatchData {
  winner: string;
  loser: string;
  score: string;
  tournament: string;
  round: string;
}

export interface ShareH2HData {
  player1: string;
  player2: string;
  p1Wins: number;
  p2Wins: number;
  totalMatches: number;
}

export async function sharePlayer(data: SharePlayerData) {
  const message = `${data.name} | #${data.ranking} | ${data.grandSlams} Grand Slams | ${data.titles} Titles 🎾 #TennisHQ`;
  try {
    await Share.share({
      message,
      title: `${data.name} - TennisHQ`,
    });
  } catch (error) {
    // User cancelled or error
  }
}

export async function shareMatch(data: ShareMatchData) {
  const message = `${data.winner} def. ${data.loser} ${data.score} in ${data.tournament} ${data.round} 🎾 #TennisHQ`;
  try {
    await Share.share({
      message,
      title: `Match Result - TennisHQ`,
    });
  } catch (error) {
    // User cancelled or error
  }
}

export async function shareH2H(data: ShareH2HData) {
  const message = `${data.player1} vs ${data.player2} | H2H: ${data.p1Wins}-${data.p2Wins} (${data.totalMatches} matches) 🎾 #TennisHQ`;
  try {
    await Share.share({
      message,
      title: `H2H - TennisHQ`,
    });
  } catch (error) {
    // User cancelled or error
  }
}
