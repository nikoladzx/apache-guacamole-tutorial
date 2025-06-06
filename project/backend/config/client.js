import ldap from 'ldapjs';

const client = ldap.createClient({
  url: 'ldap://localhost:389'
});

client.bind('cn=admin,dc=diplomski,dc=com', 'adminpassword', (err) => {
  if (err) {
    console.error('Error binding to LDAP server:', err);
  } else {
    console.log('Successfully connected to LDAP server');
  }
});

export default client;