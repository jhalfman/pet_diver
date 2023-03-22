import React, { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { useNavigate, NavLink as Link } from 'react-router-dom';
import 'animate.css';

const Dive = ( { character, setCharacter, setCharacters, characters }) => {
  const navigate = useNavigate()
  const [currentLevel, setCurrentLevel] = useState(null)
  const [currentDirections, setCurrentDirections] = useState("Choose your battle actions")
  const [currentDive, setCurrentDive] = useState(null)
  const [currentEnemies, setCurrentEnemies] = useState([])
  const [selectPetsForm, setSelectPetsForm] = useState({
    pet_id_1: null,
    pet_id_2: null
  })
  const [currentPets, setCurrentPets] = useState([])
  const [errors, setErrors] = useState(null)
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [showEnd, setShowEnd] = useState(false);
  const handleCloseEnd = () => setShowEnd(false);
  const handleShowEnd = () => setShowEnd(true);
  const [showGiveUp, setShowGiveUp] = useState(false);
  const handleCloseGiveUp = () => setShowGiveUp(false);
  const handleShowGiveUp = () => setShowGiveUp(true);
  const [diveStats, setDiveStats] = useState({
    attack: 0,
    defense: 0,
    speed: 0,
    luck: 0,
    id: 0
  })
  const [targetSelect, setTargetSelect] = useState(false)
  const [enemiesKilled, setEnemiesKilled] = useState(0)
  const [attackOrder, setAttackOrder] = useState(null)
  const [attackDisabled, setAttackDisabled] = useState(true)


  useEffect(() => {
    if (character) {
      fetch(`/dives/${character.id}`)
      .then(resp => {
        if (resp.ok) {
            resp.json().then(dive => {
              setSelectPetsForm({pet_id_1: dive.pet_id_1, pet_id_2: dive.pet_id_2})
              setCurrentEnemies(dive.enemies)
              setCurrentDive(dive.id)
              setCurrentLevel(dive.level_reached)
              setEnemiesKilled(dive.enemies_slain)
              const newPetList = character.pets.filter(pet => pet.id === dive.pet_id_1 || pet.id === dive.pet_id_2)
              setCurrentPets(newPetList)
              dive.enemies.length > 0 ? setCurrentDirections("Choose an attack type") : setCurrentDirections("Click to generate Enemies")
              updateDiveStats(newPetList)
            })
        }
        else {
            resp.json().then(noDiveError => {
                console.log(noDiveError)
            }) 
        }
      })
    }
  }, [])

  function createDive() {
    fetch(`/dives`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({character_id: character.id, ...selectPetsForm})
    })
    .then(resp => {
      if (resp.ok) {
          resp.json().then(dive => {
            setCurrentDive(dive.id)
            setCurrentLevel(1)
            setEnemiesKilled(0)
            const newPetList = character.pets.filter(pet => pet.id === dive.pet_id_1 || pet.id === dive.pet_id_2)
            setCurrentPets(newPetList)
            updateDiveStats(newPetList)
            handleClose();
          })
      }
      else {
          resp.json().then(error => {
              setErrors(error)
              handleClose();
          }) 
      }
    })
  }

  function generateEnemies() {
    const numberOfEnemies = Math.floor(Math.random() * 3) + 1
    fetch(`/enemies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({dive_id: currentDive, numberOfEnemies: numberOfEnemies, currentLevel: currentLevel})
    })
    .then(resp => {
      if (resp.ok) {
          resp.json().then(enemies => {
            console.log(enemies)
            const combatList = [{...diveStats}, ...enemies].sort(function(x, y) {return y.speed - x.speed})
            setAttackOrder(combatList)
            combatCycle(combatList)
            setCurrentEnemies(enemies)
          })
      }
      else {
          resp.json().then(error => {
              setErrors(error)
          }) 
      }
    })
  }

  //attackOrder is state; combatList is not
  function combatCycle(combatList) {
    if (combatList[0].id === 0) {
      userAttacks();
    }
    else {
      enemyAttacks(combatList);
    }
  }

  function userAttacks() {
    setCurrentDirections("Choose an attack type")
    setAttackDisabled(false)    
  }

  function enemyAttacks(combatList) {
    console.log(combatList)
    setCurrentDirections("Wait while enemies take their turn")
    setAttackDisabled(true)
  }

  function damageEnemy(id, newHp) {
    fetch(`/enemies/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({hp: newHp})
    })
    .then(resp => {
      if (resp.ok) {
          resp.json().then(enemy => {
            return enemy
          })
      }
      else {
          resp.json().then(error => {
              setErrors(error)
          }) 
      }
    })
  }

  function killEnemy(id) {
    fetch(`/enemies/${id}`, {
      method: "DELETE"
    })
    .then(resp => {
      if (resp.ok) {
          setEnemiesKilled(enemiesKilled => enemiesKilled + 1)
          console.log("Enemy Defeated!")
      }
      else {
          resp.json().then(error => {
              setErrors(error)
          }) 
      }
    })
  }

  function selectPet(e) {
    if (e.target.checked) {
      if (!selectPetsForm.pet_id_1) {
        setSelectPetsForm({...selectPetsForm, pet_id_1: e.target.id})
      }
      else {
        setSelectPetsForm({...selectPetsForm, pet_id_2: e.target.id})
      }
    }
    else {
      if (selectPetsForm.pet_id_1 === e.target.id) {
        setSelectPetsForm({...selectPetsForm, pet_id_1: null})
      }
      else {
        setSelectPetsForm({...selectPetsForm, pet_id_2: null})
      }
    }
  }

  function updateDiveStats(pets) {
    let newAttack = character.attack
    let newDefense = character.defense
    let newSpeed = character.speed
    let newLuck = character.luck

    pets.forEach(pet => {
      newAttack += pet.pet_archetype.attack * (pet.level) * (pet.energy + pet.loyalty)
      newDefense += pet.pet_archetype.defense* (pet.level) * (pet.energy + pet.loyalty)
      newSpeed += pet.pet_archetype.speed* (pet.level) * (pet.energy + pet.loyalty)
    })
    setDiveStats({
      attack: newAttack,
      defense: newDefense,
      speed: newSpeed,
      luck: newLuck,
      id: 0
    })
  }

  function singleTarget() {
    setTargetSelect(true)
    setCurrentDirections("Select single target")
  }

  function attackSingle(enemy) {
    if (diveStats.attack < enemy.defense) {
      console.log("no damage")
      return null
    }
    else if (enemy.hp > (diveStats.attack - enemy.defense)) {
      const remainingHealth = enemy.hp - (diveStats.attack - enemy.defense)
      damageEnemy(enemy.id, remainingHealth)
      const updatedEnemies = currentEnemies.map(e => {
        if (e.id === enemy.id) {
          return {...enemy, hp: remainingHealth}
        }
        else return e
      })
      setCurrentEnemies(updatedEnemies)
      const newOrder = [...attackOrder]
      newOrder.push(newOrder.shift())
      setAttackOrder(newOrder)
      combatCycle(newOrder)
    }
    else {
      killEnemy(enemy.id)
      const updatedEnemies = currentEnemies.filter(e => e.id !== enemy.id)
      setCurrentEnemies(updatedEnemies)
      if (updatedEnemies.length === 0) {
        setCurrentDirections(`${currentLevel} completed! Click to start level ${currentLevel + 1}`)
        fetch(`/dives/${currentDive}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({level_reached: currentLevel + 1})
        })
        .then(resp => {
          if (resp.ok) {
                setCurrentLevel(currentLevel + 1)
          }
          else {
              resp.json().then(error => {
                  setErrors(error)
              }) 
          }
        })
      }
      else {
        const newOrder = attackOrder.filter(character => character.id !== enemy.id)
        newOrder.push(newOrder.shift())
        setAttackOrder(newOrder)
        combatCycle(newOrder)
      }
    }
    setTargetSelect(false)
  }


  // function attackMultiple() {
  //   let updatedEnemies = [...currentEnemies]
  //   currentEnemies.forEach(enemy => {
  //     if (diveStats.attack < enemy.defense) {
  //       return null
  //     }
  //     else if (enemy.hp > (diveStats.attack - enemy.defense)) {
  //       const damage = enemy.hp - (diveStats.attack - enemy.defense)
  //       damageEnemy(enemy.id, damage)
  //       updatedEnemies = updatedEnemies.map(e => {
  //         if (e.id === enemy.id) {
  //           return {...enemy, hp: damage}
  //         }
  //         else return e
  //       })
  //     }
  //     else {
  //       killEnemy(enemy.id)
  //       updatedEnemies = updatedEnemies.filter(e => e.id !== enemy.id)
  //     }
  //   })
  //   setCurrentEnemies(updatedEnemies)
  //   if (updatedEnemies.length === 0) {
  //     setCurrentDirections(`${currentLevel} completed! Click to start level ${currentLevel + 1}`)
  //     fetch(`/dives/${currentDive}`, {
  //       method: "PATCH",
  //       headers: {
  //         "Content-Type": "application/json"
  //       },
  //       body: JSON.stringify({level_reached: currentLevel + 1})
  //     })
  //     .then(resp => {
  //       if (resp.ok) {
  //             setCurrentLevel(currentLevel + 1)
  //       }
  //       else {
  //           resp.json().then(error => {
  //               setErrors(error)
  //           }) 
  //       }
  //     })
  //   }
  //   else {
  //     enemyAttack(updatedEnemies, false)
  //   }
  // }

  // function defendAttack() {
  //   enemyAttack(currentEnemies, true);
  // }
  
  // function enemyAttack(enemyList, defense) {
  //   let returnDamage = 0;
  //   enemyList.forEach(enemy => {
  //     if (defense) {
  //       if (enemy.attack > diveStats.defense) {
  //         returnDamage += enemy.attack - diveStats.defense
  //       }
  //       else {
  //         console.log(enemy, "Defense is too high")
  //       }
  //     }
  //     else {
  //       if (enemy.attack > diveStats.defense/5) {
  //         returnDamage += enemy.attack - diveStats.defense/5
  //       }
  //       else {
  //         console.log(enemy, "Defense is too high")
  //       }
  //     }
  //   })
  //   if (returnDamage > 0) {
  //     fetch(`/characters/${character.id}`, {
  //       method: "PATCH",
  //       headers: {
  //         "Content-Type": "application/json"
  //       },
  //       body: JSON.stringify({current_hp: character.current_hp - returnDamage})
  //     })
  //     .then(resp => {
  //       if (resp.ok) {
  //         resp.json().then(char => {
  //           if (char.current_hp <=0) {
  //             setCharacter({...character, current_hp: 0})
  //             completeDive()
  //             handleShowEnd()
  //           }
  //           else {
  //             setCharacter(char)
  //           }
  //         })
  //       }
  //       else {
  //           resp.json().then(error => {
  //               setErrors(error)
  //           }) 
  //       }
  //     })
  //   }
  // }

  function completeDive() {
    fetch(`/dives/${currentDive}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({money_reward: currentLevel * 100, experience_reward: enemiesKilled * 50, current: false})
    })
    .then(resp => {
      if (resp.ok) {
          resp.json().then(dive => {
            setEnemiesKilled(dive.enemies_slain)
            const newCharacters = characters.map(char => {
              if (char.id !== character.id) {
                return char
              }
              else {
                return {...character, money: character.money + (currentLevel * 100), experience: character.experience + (enemiesKilled * 50)}
              }
            })
            setCharacters(newCharacters)
            setCurrentDive(null)
          })
          
      }
      else {
          resp.json().then(error => {
              setErrors(error)
          }) 
      }
    })
  }

    if (!character) {
      return <div>Loading Character...</div>
  }

  return (
    <Container fluid className="animate__animated animate__bounce">
      <Row className='border border-warning'>
        {currentLevel ? `Current Level: ${currentLevel} | Enemies Killed: ${enemiesKilled}` : "Initializing Dive Attempt..."}
      </Row>
      <Row>
        <Col className='border border-primary'>
          <Row className='border border-info'>
            <Col xs={4} className='border border-dark align-self-center'>
              <Form>
              {!currentDive ? character.pets ? character.pets.map(pet => {
                return <Form.Check key={pet.name} disabled={(selectPetsForm.pet_id_1 && selectPetsForm.pet_id_2) ? (parseInt(selectPetsForm.pet_id_1) === pet.id || parseInt(selectPetsForm.pet_id_2) === pet.id) ? false : true : false} type={'checkbox'} id={pet.id} label={<img src={pet.pet_archetype.image_url} alt={pet.name} style={{width: "80%", marginLeft: "10%"}}></img>} value={pet.id} onChange={selectPet}/>
              }) : null : character.pets.map(pet => {
                if (pet.id === parseInt(selectPetsForm.pet_id_1) || pet.id === parseInt(selectPetsForm.pet_id_2)) {
                  return <img key={pet.name} src={pet.pet_archetype.image_url} alt={pet.name} style={{width: "80%", marginLeft: "10%"}}></img>
                }
                else return null
              })}
              </Form>
            </Col>
            <Col className='border border-primary align-self-center'>
              <img src={character.avatar_url} alt={character.name} style={{width: "80%", marginLeft: "10%"}} key={character.name}></img>
            </Col>
          </Row>
        </Col>
        <Col xs={2} className='border border-primary align-self-center'>
          <Row>
            <p style={{textAlign: "center"}}>{currentDive ? currentDirections : "Choose companions and then click button for new adventure"}</p>
          </Row>
          <Row>
            {currentDive ? currentEnemies.length !== 0 ? null : <Button variant="warning" className='border border-dark' onClick={generateEnemies}>Generate Enemies</Button> : <Button variant="warning" className='border border-dark' onClick={handleShow}>Begin Dive</Button>}
          </Row>
        </Col>
        <Col className='border border-primary align-self-center'>
              {currentEnemies ? currentEnemies.map(enemy => {
                return <Row key={enemy.id} className='border border-primary' ><img src={enemy.enemy_archetype.image_url} alt={enemy.enemy_archetype.name} style={{width: "20%", marginLeft: "40%"}} onClick={targetSelect ? () => attackSingle(enemy) : null} ></img><h4 style={{width: "20%"}}>hp: {Math.round(enemy.hp * 100)/100}</h4></Row>
              }) : null}
        </Col>
      </Row>
      <Row>
        {/* <Col className='border border-primary'>{currentEnemies.length > 0 ? <Row style={{paddingTop: "5px", paddingBottom: "5px"}}><Button style={{width: "25%", marginLeft: "5%"}} onClick={singleTarget} disabled={attackDisabled}>Attack Single</Button><Button style={{width: "25%", marginLeft: "5%"}} onClick={attackMultiple} disabled={attackDisabled}>Attack Multiple</Button><Button style={{width: "25%", marginLeft: "5%"}} onClick={defendAttack} disabled={attackDisabled}>Defend</Button></Row> : null}
        <Row><h4>hp: {Math.round(character.current_hp * 100)/100}</h4></Row>
        </Col> */}
        <Col className='border border-primary'>{currentEnemies.length > 0 ? <Row style={{paddingTop: "5px", paddingBottom: "5px"}}><Button style={{width: "25%", marginLeft: "5%"}} onClick={singleTarget} disabled={attackDisabled}>Attack Single</Button><Button style={{width: "25%", marginLeft: "5%"}} onClick={() => console.log("click")} disabled={attackDisabled}>Attack Multiple</Button><Button style={{width: "25%", marginLeft: "5%"}} onClick={() => console.log("click")} disabled={attackDisabled}>Defend</Button></Row> : null}
        <Row><h4>hp: {Math.round(character.current_hp * 100)/100}</h4></Row>
        </Col>
        <Col xs={2} className='border border-primary'>2 of 3 (wider)</Col>
        <Col className='border border-primary'>
          <Link to={`/characters/${character.name}`} className="nav-link link-dark" style={{width: "50%", marginLeft: "25%", textAlign: "center"}}><button className="btn btn-primary" style={{width: "100%"}}>Back to Character</button></Link>
          <Button style={{width: "50%", marginLeft: "25%", textAlign: "center", marginTop: "5px"}} onClick={handleShowGiveUp}>Give Up</Button>
          </Col>
      </Row>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Start New Dive</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to begin a new dive with the selected pets?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={createDive}>
            Start Dive
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEnd} onHide={handleCloseEnd}>
        <Modal.Header closeButton>
          <Modal.Title>You've Been Defeated!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h4>Dive Stats</h4>
          <ul>
            <li>Money earned: {currentLevel * 100} credits</li>
            <li>Experience gained: {enemiesKilled * 50}</li>
            <li>Enemies defeated: {enemiesKilled}</li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => navigate(`/characters/${character.name}`)}>
            Complete Dive
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showGiveUp} onHide={handleCloseGiveUp}>
        <Modal.Header closeButton>
          <Modal.Title>Give Up?</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to quit this run?</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => {
            completeDive()
            handleShowEnd()
          }}>
            Give Up Dive
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Dive