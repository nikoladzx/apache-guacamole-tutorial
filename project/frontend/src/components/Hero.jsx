import { Container, Card, Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import Hero from "./Test";

const Hero2 = () => {
  const { userInfo } = useSelector((state) => state.auth);
  return (
    <div className="d-flex py-5 justify-content-center">
      <div className="d-flex">
        {userInfo ? (
          <Hero />
        ) : (
          <>
            <Container className="d-flex justify-content-center">
              <Card className="p-5 d-flex flex-column align-items-center hero-card bg-light w-75">
                <h1 className="text-center mb-4">Morate biti registrovani </h1>
                <p className="text-center mb-4">
                  Ukoliko vidite ovu poruku, kontaktirajte asistenta kako bi Vam
                  omogućio pristup
                </p>
                <Button variant="primary" href="/register">
                  Registracija
                </Button>
              </Card>
            </Container>
          </>
        )}
      </div>
    </div>
  );
};

export default Hero2;
