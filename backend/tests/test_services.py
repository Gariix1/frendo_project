import os
import tempfile
import unittest

from fastapi import HTTPException  # type: ignore
from backend import storage
from backend.services import games_service, people_service
from backend.models import (
  CreateGameRequest,
  AddParticipantsByIdsRequest,
  UpdateParticipantRequest,
  DrawRequest,
  WishListItemRequest,
  CreatePeopleRequest,
)
from backend.core import errors as core_errors

core_errors.HTTPException = HTTPException


class ServiceTestCase(unittest.TestCase):
  def setUp(self):
    self.temp_dir = tempfile.TemporaryDirectory()
    storage.DATA_DIR = self.temp_dir.name
    storage.JSON_FALLBACK = os.path.join(self.temp_dir.name, "data.json")
    storage.DB_PATH = os.path.join(self.temp_dir.name, "data.sqlite")
    os.makedirs(storage.DATA_DIR, exist_ok=True)
    with storage.edit_state() as state:
      state["games"] = {}
      state["people"] = []
    os.environ.pop("MASTER_ADMIN_PASSWORD", None)

  def tearDown(self):
    self.temp_dir.cleanup()


class GamesServiceTests(ServiceTestCase):
  def setUp(self):
    super().setUp()
    with storage.edit_state() as state:
      state["people"] = [
        {"id": "u1", "name": "Ana", "active": True},
        {"id": "u2", "name": "Luis", "active": True},
        {"id": "u3", "name": "Eva", "active": True},
      ]

  def create_base_game(self) -> str:
    payload = CreateGameRequest(
      title=" Fiesta ",
      admin_password="admin123",
      person_ids=["u1", "u2"],
      participants=["Carlos", "Diana"],
    )
    result = games_service.create_game(payload)
    gid = result["game_id"]
    return gid

  def test_create_game_and_add_participants(self):
    gid = self.create_base_game()
    status = games_service.get_game_status(gid, "admin123")
    self.assertEqual(len(status.participants), 4)
    add_resp = games_service.add_participants_by_ids(
      gid,
      AddParticipantsByIdsRequest(person_ids=["u3"]),
      "admin123",
    )
    self.assertEqual(len(add_resp["added"]), 1)
    updated = games_service.get_game_status(gid, "admin123")
    self.assertEqual(len(updated.participants), 5)

  def test_draw_and_reveal_flow(self):
    gid = self.create_base_game()
    draw_resp = games_service.draw_assignments(gid, DrawRequest(force=False), "admin123")
    self.assertGreater(draw_resp["assignment_version"], 0)
    status = games_service.get_game_status(gid, "admin123")
    token = status.participants[0].token
    preview = games_service.participant_preview(gid, token)
    self.assertTrue(preview.can_reveal)
    reveal = games_service.reveal_assignment(gid, token)
    self.assertTrue(reveal.assigned_to)
    updated = games_service.get_game_status(gid, "admin123")
    first = next(p for p in updated.participants if p.token == token)
    self.assertTrue(first.viewed)

  def test_deactivate_and_remove_participant(self):
    gid = self.create_base_game()
    status = games_service.get_game_status(gid, "admin123")
    token = status.participants[0].token
    resp = games_service.set_token_active(gid, token, "admin123", False)
    self.assertTrue(resp["ok"])
    games_service.set_token_active(gid, token, "admin123", True)
    # remove a participant before reveal
    pid = status.participants[-1].id
    games_service.remove_participant(gid, pid, "admin123")
    updated = games_service.get_game_status(gid, "admin123")
    self.assertEqual(len(updated.participants), len(status.participants) - 1)

  def test_wishlist_flow(self):
    gid = self.create_base_game()
    status = games_service.get_game_status(gid, "admin123")
    target = status.participants[0]
    resp = games_service.add_wish_list_item_admin(
      gid,
      target.id,
      WishListItemRequest(title="Libro", price=20.5, url="https://example.com"),
      "admin123",
    )
    self.assertEqual(resp["item"].title, "Libro")
    wishlist = games_service.get_wish_list_admin(gid, target.id, "admin123")
    self.assertEqual(len(wishlist["items"]), 1)
    token_resp = games_service.get_wish_list_by_token(gid, target.token)
    self.assertEqual(len(token_resp["items"]), 1)
    games_service.add_wish_list_item_by_token(gid, target.token, WishListItemRequest(title="Bufanda"))
    token_wishlist = games_service.get_wish_list_by_token(gid, target.token)
    self.assertEqual(len(token_wishlist["items"]), 2)
    item_id = token_wishlist["items"][0].id
    games_service.remove_wish_list_item_by_token(gid, target.token, item_id)
    token_wishlist_after = games_service.get_wish_list_by_token(gid, target.token)
    self.assertEqual(len(token_wishlist_after["items"]), 1)


class PeopleServiceTests(ServiceTestCase):
  def test_add_and_rename_people(self):
    payload = CreatePeopleRequest(names=[" Ana ", "Bea"])
    resp = people_service.add_people(payload, None)
    self.assertEqual(len(resp["added"]), 2)
    with self.assertRaises(HTTPException):
      people_service.add_people(CreatePeopleRequest(names=["Dani", "Dani"]), None)
    added_id = resp["added"][0]["id"]
    rename_payload = UpdateParticipantRequest(name="Carla")
    rename_resp = people_service.rename_person(added_id, rename_payload, None)
    self.assertTrue(rename_resp["ok"])


if __name__ == "__main__":
  unittest.main()
