import  { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "../slices/authSlice";
import { toast } from "react-toastify";
import FormContainer from "../components/FormContainer";
import RegistrationSuccess from "../components/RegistrationSuccess";
import axios from "axios";


const RegisterScreen = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDesk, setSelectedDesk] = useState("");
  const [registrationSuccessful, setRegistrationSuccessful] = useState(false);

  const dispatch = useDispatch();
  useSelector((state) => state.auth);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        console.log("Fetching rooms...");
        const response = await axios.get("http://192.168.1.3:5000/api/pcs/getRooms");
        console.log("Response:", response);
        console.log("Response data:", response.data);
        if (Array.isArray(response.data)) {
          setRooms(response.data);
        } else {
          console.error("Unexpected response data format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
        toast.error("Failed to fetch rooms");
      }
    };

    fetchRooms();
  }, []);


  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://192.168.1.3:5000/api/pcs/register",
        {
          name,
          password,
          roomNumber: selectedRoom,
          pcNumber: selectedDesk,
        },
        {
          withCredentials: true
        }
      );
      const { data } = response;
      console.log(data);
      dispatch(setCredentials({ ...data }));
      setRegistrationSuccessful(true);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  return (
    <FormContainer>
      {registrationSuccessful ? (
        <RegistrationSuccess />
      ) : (
        <>
          <h1>Registracija</h1>
          <Form onSubmit={submitHandler}>
            <Form.Group controlId="name">
              <Form.Label>Ime</Form.Label>
              <Form.Control
                type="text"
                placeholder="Unesite ime"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="password">
              <Form.Label>Šifra</Form.Label>
              <Form.Control
                type="password"
                placeholder="Unesite šifru"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="room">
              <Form.Label>Ucionica</Form.Label>
              <Form.Control
                as="select"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
              >
                <option value="">Izaberite ucionicu</option>
                {rooms.map((room) => (
                  <option key={room.identifier} value={room.identifier}>
                    {room.identifier}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="desk">
              <Form.Label>Racunar</Form.Label>
              <Form.Control
                as="select"
                value={selectedDesk}
                onChange={(e) => setSelectedDesk(e.target.value)}
                disabled={!selectedRoom}
              >
                <option value="">Izaberite redni broj racunara</option>
                {selectedRoom &&
                  rooms
                    .find((room) => room.identifier === selectedRoom)
                    ?.roomNumbers.map((desk) => (
                      <option key={desk} value={desk}>
                        {desk}
                      </option>
                    ))}
              </Form.Control>
            </Form.Group>
            <Button type="submit" variant="primary" className="mt-3">
              Registruj računar
            </Button>
          </Form>
        </>
      )}
    </FormContainer>
  );
};

export default RegisterScreen;