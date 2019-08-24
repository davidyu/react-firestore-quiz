import React from 'react';
import '../styles/Leaderboard.css';
import {db, FieldValue} from '../firebase.js';
import {Profiles} from '../constants/Profiles.js';

class Leaderboard extends React.Component {
    
    state = {
        leaderboard: [],
        teamCarlScore: 0,
        teamSophiaScore: 0,
    }

    componentWillMount() {
        let self = this;
        db.collection("questions").get()
            .then(snapshot => {
                let questions = [];
                snapshot.forEach(doc => {
                    questions.push(doc.data());
                });
                questions.sort( ( a, b ) => { return a.id - b.id } );
                self.setState({questions : questions});

                return db.collection("state").get().then(stateSnapshot => {
                    let answers = {};
                    stateSnapshot.forEach(doc => {
                        const response = doc.data();
                        answers[response.id] = response;
                    });

                    return questions.map(question => {
                        question.results = answers[question.id];
                        return question;
                    });
                });
            })
            .then(results => {
                let leaderboard = {};
                results.map(result => {
                    const correctResponses = result.results[`response${result.correct + 1}`];
                    if (correctResponses) {
                        correctResponses.forEach(respondee => {
                            leaderboard[respondee] = (leaderboard[respondee] || 0) + 1;
                        });
                    }
                });

                let keys = Object.keys(leaderboard);
                keys.sort((a, b) => { return leaderboard[b] - leaderboard[a] });

                const highScores = keys.map(key => {
                    return { 
                        score: leaderboard[key],
                        profile: Profiles.find(profile => profile.id === key)
                    };
                });

                const playersWithScores = highScores.map(player => player.profile.id);
                const playersWithoutScores = Profiles.filter(profile => !playersWithScores.includes(profile.id)).map(profile => {
                    return {
                        score: 0,
                        profile: profile
                    };
                });

                const teamCarlScore = highScores.reduce((total, player) =>
                {
                    return total + (player.profile.association == 'carl' ? player.score : 0);
                }, 0);

                const teamSophiaScore = highScores.reduce((total, player) =>
                {
                    return total + (player.profile.association == 'sophia' ? player.score : 0);
                }, 0);
                
                self.setState({leaderboard: highScores.concat(playersWithoutScores),
                               teamCarlScore: teamCarlScore,
                               teamSophiaScore: teamSophiaScore});
            });
    }
    
    render() {
        // only show first 10
        const leaderboard = this.state.leaderboard.slice(0, 10).map((entry, idx) => {
            let medal = "";
            if (idx == 0) {
                medal = "🥇";
            } else if (idx == 1) {
                medal = "🥈";
            } else if (idx == 2) {
                medal = "🥉";
            }
            return (
                <tr key={entry.profile.id}>
                    <td>
                        <img className={"profile-img " + entry.profile.association} src={entry.profile.img}/>
                    </td>
                    <td align='left'>
                        <p className='leaderboard-name'>{`#${idx + 1} ${entry.profile.firstName} ${entry.profile.lastName} ${medal}`}</p>
                    </td>
                    <td>
                        <p>{entry.score}</p>
                    </td>
                </tr>
            );
        });

        return (
            <div id='leaderboard'>
                <h2 className='leaderboard-title'>Thank You For Participating!</h2>
                <p id="team-scores"><span id="team-carl">Team Carl:</span> {this.state.teamCarlScore} &nbsp;&nbsp;<span id="team-sophia">Team Sophia:</span> {this.state.teamSophiaScore}</p>
                <table id="heroic-leaderboard">
                    <tbody>
                        {leaderboard}
                    </tbody>
                </table>
            </div>
        )
    }
}

export default Leaderboard;
