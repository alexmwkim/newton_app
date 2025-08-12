const React = require('react');
const { View, Text, TouchableOpacity, SafeAreaView } = require('react-native');

// React 전역 설정
global.React = React;

function NoteDetailScreenSimple({ 
  noteId, 
  note = null,
  navigation,
  onBack
}) {
  console.log('📝 Simple NoteDetailScreen rendering with noteId:', noteId);

  return React.createElement(SafeAreaView, { 
    style: { 
      flex: 1, 
      backgroundColor: 'white',
      padding: 20
    } 
  },
    React.createElement(View, { style: { flex: 1 } },
      // Header with back button
      React.createElement(View, { 
        style: { 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginBottom: 20,
          paddingTop: 10
        } 
      },
        React.createElement(TouchableOpacity, {
          onPress: onBack,
          style: {
            padding: 10,
            marginRight: 15
          }
        },
          React.createElement(Text, { style: { fontSize: 18, color: '#007AFF' } }, '← Back')
        ),
        React.createElement(Text, { 
          style: { 
            fontSize: 18, 
            fontWeight: '600',
            color: '#000'
          } 
        }, 'Note Detail')
      ),
      
      // Note content
      React.createElement(View, { style: { flex: 1 } },
        React.createElement(Text, { 
          style: { 
            fontSize: 16, 
            marginBottom: 10,
            color: '#666'
          } 
        }, `Note ID: ${noteId}`),
        React.createElement(Text, { 
          style: { 
            fontSize: 20, 
            fontWeight: '500',
            marginBottom: 15,
            color: '#000'
          } 
        }, note?.title || 'Loading note...'),
        React.createElement(Text, { 
          style: { 
            fontSize: 16, 
            lineHeight: 24,
            color: '#333'
          } 
        }, note?.content || 'Note content will appear here...')
      )
    )
  );
}

module.exports = NoteDetailScreenSimple;