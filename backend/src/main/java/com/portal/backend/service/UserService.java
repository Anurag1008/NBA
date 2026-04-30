package com.portal.backend.service;
import java.util.List;

import com.portal.backend.dto.AddUserRequestDto;
import com.portal.backend.dto.UserDto;

public interface UserService {
    public List<UserDto> getAllUsers();
    public UserDto createNewUser(AddUserRequestDto addUserRequestDto);
    public void deleteById(Long id);
}
