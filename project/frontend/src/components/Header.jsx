import { Navbar, Container } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";

const Header = () => {
  return (
    <header>
      <Navbar bg="dark" variant="dark" expand="lg" collapseOnSelect>
        <Container>
          <LinkContainer to="/">
            <Navbar.Brand>VM Connector</Navbar.Brand>
          </LinkContainer>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
